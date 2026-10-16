import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
    createArtifact,
    deleteArtifact,
    getArtifact,
    listArtifacts,
} from "../controllers/artifact.controller.js";

export const artifactRoutes = Router({ mergeParams: true });

artifactRoutes.get("/:workspaceId", asyncHandler(listArtifacts));

artifactRoutes.post("/:workspaceId", asyncHandler(createArtifact));

artifactRoutes.get(
    "/:workspaceId/:artifactId",
    asyncHandler(getArtifact),
);

artifactRoutes.delete(
    "/:workspaceId/:artifactId",
    asyncHandler(deleteArtifact),
);