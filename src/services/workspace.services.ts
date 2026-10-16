import { WorkspaceSelect } from "../generated/prisma/models.js";
import { deleteWorkspaceVectors } from "../lib/pinecone.js";
import { createWorkspace, deleteWorkspace, findWorkspaceByIdAndUserId, findWorkspacesByUserId, updateWorkspace } from "../repository/workspace.repository.js";
import { NotFoundError } from "../types/app-error.js";
import { CreateWorkspaceInput, UpdateWorkspaceInput } from "../validators/workspace.validator.js";

export async function listAllWorkspace(userId: string) {
    return await findWorkspacesByUserId(userId);
}

export async function getWorkspaceByIdForUserId(workspaceId: string, userId: string) {
    const workspaceExist = await findWorkspaceByIdAndUserId(workspaceId, userId);
    if (!workspaceExist) throw new NotFoundError("Workspace not found");

    return workspaceExist;
}

export async function createWorkspaceForUser(userId: string, data: CreateWorkspaceInput) {
    return await createWorkspace(userId, data);
}

export async function updateWorkspaceForUser(workspaceId: string, userId: string, data: UpdateWorkspaceInput) {
    await getWorkspaceByIdForUserId(workspaceId, userId);
    return await updateWorkspace(workspaceId, data);
}

export async function deleteWorkspaceForUser(workspaceId: string, userId: string) {
    await getWorkspaceByIdForUserId(workspaceId, userId);

    try {
        // We will delete the vector embedding of this workspace 
        await deleteWorkspaceVectors(workspaceId);
    }
    catch (error) {
        console.error("Failed to delete Pinecone namespace:", error);
    }

    await deleteWorkspace(workspaceId);

}