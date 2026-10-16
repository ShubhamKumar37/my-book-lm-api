import type { Request, Response } from "express";
import { createWorkspaceForUser, deleteWorkspaceForUser, getWorkspaceByIdForUserId, listAllWorkspace, updateWorkspaceForUser } from "../services/workspace.services.js";
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdParamSchema } from "../validators/workspace.validator.js";
import { ValidationError } from "../types/app-error.js";
import { getZodFieldErrors } from "../utils/zod-error.js";

function parseWorkspaceId(params: Request["params"]) {
    const parsed = workspaceIdParamSchema.safeParse(params);

    if (!parsed.success) {
        throw new ValidationError(
            "Invalid workspace id",
            getZodFieldErrors(parsed.error),
        );
    }
    return parsed.data;
}
function parseCreateBody(body: Request["body"]) {
    const parsed = createWorkspaceSchema.safeParse(body);

    if (!parsed.success) throw new ValidationError("All fields are importent of workspace", getZodFieldErrors(parsed.error));

    return parsed.data;
}

function parseUpdateBody(body: Request["body"]) {
    const parsed = updateWorkspaceSchema.safeParse(body);

    if (!parsed.success) throw new ValidationError("Aleast provide 1 field to update", getZodFieldErrors(parsed.error));

    return parsed.data;
}

export async function listWorkspaces(req: Request, res: Response) {
    const workspaces = await listAllWorkspace(req.session.user.id);
    res.json(workspaces);
}

export async function getWorkspace(req: Request, res: Response) {
    const { workspaceId } = parseWorkspaceId(req.params);
    const workspace = await getWorkspaceByIdForUserId(workspaceId, req.session.user.id);

    res.json(workspace);
}

export async function createWorkspace(req: Request, res: Response) {
    const input = parseCreateBody(req.body);
    const workspace = await createWorkspaceForUser(req.session.user.id, input);

    res.status(201).json(workspace);
}

export async function updateWorkspace(req: Request, res: Response) {
    const { workspaceId } = parseWorkspaceId(req.params);
    const input = parseUpdateBody(req.body);
    const updatedWorkspace = await updateWorkspaceForUser(workspaceId, req.session.user.id, input);

    res.status(201).json(updatedWorkspace);
}

export async function deleteWorkspace(req: Request, res: Response) {
    const { workspaceId } = parseWorkspaceId(req.params);

    await deleteWorkspaceForUser(workspaceId, req.session.user.id);
    res.json({ message: "Deleted successfully" });
}