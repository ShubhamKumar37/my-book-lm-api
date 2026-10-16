import { Router } from "express";

import { asyncHandler } from "../utils/async-handler.js";
import { bulkDeleteSources, createSource, deleteSource, getSource, getSourceChunks, importWebsites, importYoutube, listSources, reprocessSource, uploadPdf } from "../controllers/soure.controller.js";
import { uploadSinglePdf } from "../middleware/upload.middleware.js";

export const sourceRoutes = Router({ mergeParams: true });

sourceRoutes.get("/:workspaceId", asyncHandler(listSources));
sourceRoutes.post("/", asyncHandler(createSource));

sourceRoutes.post(
    "/upload/:workspaceId",
    uploadSinglePdf,
    asyncHandler(uploadPdf),
);

sourceRoutes.get("/:sourceId", asyncHandler(getSource));
sourceRoutes.delete("/:workspaceId/:sourceId", asyncHandler(deleteSource));

sourceRoutes.post(
    "/import/youtube/:workspaceId",
    asyncHandler(importYoutube),
);

sourceRoutes.post(
    "/import/website/:workspaceId",
    asyncHandler(importWebsites),
);

sourceRoutes.post(
    "/bulk-delete",
    asyncHandler(bulkDeleteSources),
);

sourceRoutes.post(
    "/reprocess/:sourceId/:workspaceId",
    asyncHandler(reprocessSource),
);
// sourceRoutes.post("/import/web-search", asyncHandler(importWebSearch));
// sourceRoutes.post("/reprocess", asyncHandler(reprocessSources));
// sourceRoutes.get("/:sourceId/chunks", asyncHandler(getSourceChunks));
// sourceRoutes.post("/:sourceId/reprocess", asyncHandler(reprocessSource));