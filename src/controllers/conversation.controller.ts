import type { Request, Response } from "express";

import {
    listWorkspaceConversations,
    createWorkspaceConversation,
    renameWorkspaceConversation,
    deleteWorkspaceConversation,
} from "../services/conversation.service.js";

import {
    createConversationSchema,
} from "../validators/chat.validator.js";

import { z } from "zod";
import { workspaceIdParamSchema } from "../validators/workspace.validator.js";

const conversationParamsSchema = z.object({
    workspaceId: z.string().trim().min(1),
    conversationId: z.string().trim().min(1),
});

const updateConversationSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(120),
});

export async function listConversations(req: Request, res: Response) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const userId = req.session.user.id;

    const conversations = await listWorkspaceConversations(
        workspaceId,
        userId,
    );

    res.status(200).json(conversations);
}

export async function createConversation(req: Request, res: Response) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const input = createConversationSchema.parse(req.body);
    const userId = req.session.user.id;

    const conversation = await createWorkspaceConversation(
        workspaceId,
        userId,
        input,
    );

    res.status(201).json(conversation);
}

export async function updateConversation(req: Request, res: Response) {
    const { workspaceId, conversationId } =
        conversationParamsSchema.parse(req.params);

    const { title } = updateConversationSchema.parse(req.body);
    const userId = req.session.user.id;

    const conversation = await renameWorkspaceConversation(
        workspaceId,
        conversationId,
        userId,
        title,
    );

    res.status(200).json(conversation);
}

export async function deleteConversation(req: Request, res: Response) {
    const { workspaceId, conversationId } =
        conversationParamsSchema.parse(req.params);

    const userId = req.session.user.id;

    const result = await deleteWorkspaceConversation(
        workspaceId,
        conversationId,
        userId,
    );

    res.status(200).json({
        message: "Conversation deleted successfully",
        ...result,
    });
}
