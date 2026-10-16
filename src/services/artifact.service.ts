import { Prisma } from "../generated/prisma/client.js";
import { ArtifactRecord, createArtifactRecord, deleteArtifactRecord, findArtifactById, findArtifactByIdAndWorkspaceId, findArtifactsByWorkspaceId, updateArtifactRecord } from "../repository/artifact.repository.js";
import { NotFoundError } from "../types/app-error.js";
import { CreateArtifactInput } from "../validators/artifact.validator.js";
import { gatherSourceContext, generateArtifactContent } from "./artifact-generation.service.js";
import { getWorkspaceByIdForUserId } from "./workspace.services.js";
import { enqueueArtifactGeneration } from "../lib/artifact-event.js";

export async function listArtifactsForWorkspace(
    workspaceId: string,
    userId: string,
) {
    await getWorkspaceByIdForUserId(workspaceId, userId);
    return findArtifactsByWorkspaceId(workspaceId);
}

export async function getArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
) {
    await getWorkspaceByIdForUserId(workspaceId, userId);

    const artifact = await findArtifactByIdAndWorkspaceId(
        artifactId,
        workspaceId,
    );

    if (!artifact) {
        throw new NotFoundError("Artifact not found");
    }

    return artifact;
}

export async function deleteArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
) {
    await getArtifactForWorkspace(workspaceId, artifactId, userId);
    await deleteArtifactRecord(artifactId);
}

export async function createArtifactForWorkspace(
    workspaceId: string,
    userId: string,
    input: CreateArtifactInput,
) {
    await getWorkspaceByIdForUserId(workspaceId, userId);

    const context = await gatherSourceContext(
        workspaceId,
        input.sourceIds,
    );

    const artifact = await createArtifactRecord({
        workspaceId,
        type: input.type,
        title:
            input.title ||
            `${{
                SUMMARY: "Summary",
                TAKEAWAYS: "Key Takeaways",
                FLASHCARDS: "Flashcards",
                QUIZ: "Quiz",
                MINDMAP: "Mind Map",
                REPORT: "AI Report",
            }[input.type]} · ${new Date().toLocaleDateString()}`,
        sourceIds: context.sourceIds,
        status: "PENDING",
    });

    try {
        await enqueueArtifactGeneration({
            artifactId: artifact.id,
            workspaceId,
        });
    } catch (error) {
        console.error("Failed to enqueue artifact generation:", error);

        await updateArtifactRecord(artifact.id, {
            status: "FAILED",
            metadata: {
                processingError: "Failed to schedule artifact generation",
            },
        });

        throw error;
    }

    return artifact;
}


export async function processArtifactById(artifactId: string) {
    const artifact = await findArtifactById(artifactId);
    if (!artifact) throw new Error("Artifact not found");

    await updateArtifactRecord(artifactId, { status: "PROCESSING" });

    try {
        const context = await gatherSourceContext(
            artifact.workspaceId,
            artifact.sourceIds,
        );
        const content = await generateArtifactContent(artifact.type, context.text);

        return updateArtifactRecord(artifactId, {
            status: "READY",
            content: content as Prisma.InputJsonValue,
            metadata: {
                generatedAt: new Date().toISOString(),
                processingError: undefined,
            },
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Artifact generation failed";

        await updateArtifactRecord(artifactId, {
            status: "FAILED",
            metadata: {
                processingError: message,
            },
        });

        throw error;
    }
}

export type { ArtifactRecord };