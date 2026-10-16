
import {
    findConversationsByWorkspaceId,
    findConversationByIdAndWorkspaceId,
    createConversationRecord,
    updateConversationRecord,
    deleteConversationRecord,
} from "../repository/conversation.repository.js";

import { findWorkspaceByIdAndUserId } from "../repository/workspace.repository.js";

import { NotFoundError } from "../types/app-error.js";

import type { CreateConversationInput } from "../validators/chat.validator.js";

async function assertWorkspaceAccess(
    workspaceId: string,
    userId: string,
) {
    const workspace = await findWorkspaceByIdAndUserId(
        workspaceId,
        userId,
    );

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    return workspace;
}

export async function listWorkspaceConversations(
    workspaceId: string,
    userId: string,
) {
    await assertWorkspaceAccess(workspaceId, userId);

    return findConversationsByWorkspaceId(workspaceId);
}

export async function createWorkspaceConversation(
    workspaceId: string,
    userId: string,
    input: CreateConversationInput,
) {
    await assertWorkspaceAccess(workspaceId, userId);

    return createConversationRecord(
        workspaceId,
        input.title,
    );
}

export async function renameWorkspaceConversation(
    workspaceId: string,
    conversationId: string,
    userId: string,
    title: string,
) {
    await assertWorkspaceAccess(workspaceId, userId);

    const conversation =
        await findConversationByIdAndWorkspaceId(
            conversationId,
            workspaceId,
        );

    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }

    return updateConversationRecord(conversationId, {
        title,
    });
}

export async function deleteWorkspaceConversation(
    workspaceId: string,
    conversationId: string,
    userId: string,
) {
    await assertWorkspaceAccess(workspaceId, userId);

    const conversation =
        await findConversationByIdAndWorkspaceId(
            conversationId,
            workspaceId,
        );

    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }

    await deleteConversationRecord(conversationId);

    return { id: conversationId };
}
