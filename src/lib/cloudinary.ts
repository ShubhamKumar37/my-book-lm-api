import { v2 as cloudinary } from "cloudinary";
import { ValidationError } from "../types/app-error.js";

const cloudName = process.env.CLOUDINARY_API_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

/** Normalized result returned after a successful Cloudinary upload. */
export type CloudinaryUploadResult = {
    secureUrl: string;
    publicId: string;
    bytes: number;
    originalFilename: string;
    resourceType: "raw" | "image";
};

type CloudinaryUploadResponse = {
    secure_url: string;
    public_id: string;
    bytes: number;
    resource_type?: string;
    error?: { message: string };
};

export function getSignedCloudinaryDownloadUrl(
    publicId: string,
    resourceType: "raw" | "image" = "raw",
) {
    if (!cloudName || !apiKey || !apiSecret) {
        return null;
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });

    return cloudinary.url(publicId, {
        resource_type: resourceType,
        type: "upload",
        sign_url: true,
        secure: true,
    });
}

/**
 * Uploads a PDF buffer to Cloudinary.
 *
 * @param buffer - PDF file bytes from Multer
 * @param filename - Original filename
 * @returns Upload metadata including secure URL and public id
 */
export async function uploadPdfToCloudinary(
    buffer: Buffer,
    filename: string,
): Promise<CloudinaryUploadResult> {
    if (!cloudName || !apiKey || !apiSecret) {
        throw new ValidationError(
            "Cloudinary is not configured on the server",
        );
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "raw",
                folder: "chaibook/pdfs",
                use_filename: true,
                unique_filename: true,
            },
            (
                error,
                result,
            ) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);

                    reject(
                        new ValidationError(
                            error.message || "Cloudinary upload failed",
                        ),
                    );

                    return;
                }

                if (!result) {
                    reject(
                        new ValidationError(
                            "Cloudinary did not return an upload result",
                        ),
                    );

                    return;
                }

                resolve({
                    secureUrl: result.secure_url,
                    publicId: result.public_id,
                    bytes: result.bytes,
                    originalFilename: filename,
                    resourceType:
                        result.resource_type === "image"
                            ? "image"
                            : "raw",
                });
            },
        );

        uploadStream.end(buffer);
    });
}