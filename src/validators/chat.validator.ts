import { z } from "zod"
import { CHAT_MODELS } from "../lib/ai-config.js"
import { workspaceIdParamSchema } from "./workspace.validator.js"
import type { UIMessage } from "ai";

export const conversationIdParamSchema = z.object({
    conversationId: z.string().trim().min(1, "Conversation id is required"),
});

const uiMessageSchema = z.object({
    id: z.string().min(1),
    role: z.enum(["system", "user", "assistant"]),
    parts: z.array(z.unknown()),
});

export const chatBodySchema = z.object({
    conversationId: z.string().trim().min(1).optional(),
    messages: z
        .array(uiMessageSchema)
        .min(1)
        .transform((messages) => messages as UIMessage[]),
    model: z.enum(CHAT_MODELS).optional(),
    webSearch: z.boolean().optional(),
});

export const createConversationSchema = z.object({
    title: z.string().trim().min(1).max(120).optional()
});

export type ChatBody = z.infer<typeof chatBodySchema>;
export type CreateConversationInput = z.infer<
    typeof createConversationSchema
>;