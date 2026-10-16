
import type { Request, Response } from "express";

import { streamWorkspaceChat, getConversationMessagesForWorkspace } from "../services/chat.service.js";
import { chatBodySchema } from "../validators/chat.validator.js";
import { workspaceIdParamSchema } from "../validators/workspace.validator.js";

export async function streamChat(req: Request, res: Response) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);

    const input = chatBodySchema.parse(req.body);
    const userId = req.session.user.id;

    await streamWorkspaceChat(
        res,
        workspaceId,
        userId,
        input,
    );
}

export async function getChatMessages(req: Request, res: Response): Promise<void> {
    const { workspaceId, conversationId } = req.params;
    const userId = req.session.user.id;

    if (
        typeof workspaceId !== "string" ||
        typeof conversationId !== "string"
    ) {
        res.status(400).json({
            message: "Invalid workspaceId or conversationId",
        });
        return;
    }

    const messages = await getConversationMessagesForWorkspace(
        workspaceId,
        conversationId,
        userId
    );

    res.status(200).json({ messages });
}
