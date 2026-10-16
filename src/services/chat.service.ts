import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, createUIMessageStream, isStepCount, pipeUIMessageStreamToResponse, streamText, tool, toUIMessageStream, UIMessage } from "ai";
import { createConversationRecord, deleteConversationRecord, findConversationByIdAndWorkspaceId, touchConversation, updateConversationRecord } from "../repository/conversation.repository.js";
import { countMessagesByConversationId, createMessageRecord, findMessagesByConversationId } from "../repository/message.repository.js";
import { NotFoundError, ValidationError } from "../types/app-error.js";
import { buildConversationTitle, getLastUserMessageText, getTextFromUIMessage } from "../utils/chat-message.js";
import { getWorkspaceByIdForUserId } from "./workspace.services.js";
import { Response } from "express";
import { CHAT_MODEL, CHAT_MODELS, CONVERSATION_SUMMARY_INTERVAL, RECENT_MESSAGE_WINDOW } from "../lib/ai-config.js";
import { buildChatSystemPrompt, retrieveWorkspaceContext } from "../lib/rag/retrieve.js";
import { z } from "zod";
import { formatTavilyResultsForPrompt, searchWeb, type TavilySearchResponse } from "../lib/tavily.js";
import { enqueueConversationSummarize } from "../lib/conversation-events.js";
import { addMemoriesFromMessages, searchUserMemories } from "../lib/mem0.js";

export async function createConversationForWorkspace(workspaceId: string, userId: string, title?: string) {
    await getWorkspaceByIdForUserId(workspaceId, userId);
    return createConversationRecord(workspaceId, title);
}

export async function getConversationMessagesForWorkspace(
    workspaceId: string,
    conversationId: string,
    userId: string
) {
    const workspace = await getWorkspaceByIdForUserId(workspaceId, userId);

    if (!workspace) {
        throw new NotFoundError("Workspace not found");
    }

    const conversation = await findConversationByIdAndWorkspaceId(
        conversationId,
        workspaceId
    );

    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }

    const records = await findMessagesByConversationId(conversationId);

    return records.map((message) => ({
        id: message.id,
        role: message.role.toLowerCase() as "user" | "assistant",
        parts: [
            {
                type: "text" as const,
                text: message.content,
            },
        ],
        metadata: {
            citations: message.citations,
            createdAt: message.createdAt,
        },
    }));
}

export async function deleteConversationForWorkspace(workspaceId: string, conversationId: string, userId: string) {
    await getWorkspaceByIdForUserId(workspaceId, userId);

    const conversation = await findConversationByIdAndWorkspaceId(conversationId, workspaceId);
    if (!conversation) throw new NotFoundError("Conversation not found");

    return deleteConversationRecord(conversationId);
}

async function resolveConversation(workspaceId: string, conversationId: string | undefined, firstMessage: string) {
    if (conversationId) {
        const conversation = await findConversationByIdAndWorkspaceId(conversationId, workspaceId);
        if (!conversation) throw new NotFoundError("Conversation not found");

        return conversation;
    }

    return createConversationRecord(workspaceId, buildConversationTitle(firstMessage));
}

export async function streamWorkspaceChat(
    res: Response,
    workspaceId: string,
    userId: string,
    input: {
        conversationId?: string,
        messages: UIMessage[],
        model?: string,
        webSearch?: boolean
    }
) {
    const workspace = await getWorkspaceByIdForUserId(workspaceId, userId);
    const requestModel = input?.model || workspace.defaultModel;
    const chatModel = CHAT_MODELS.find((item) => item === requestModel) ?? CHAT_MODEL;
    const webSearchEnabled = input.webSearch === true && !!process.env.TAVILY_API_KEY?.trim();

    const userText = getLastUserMessageText(input.messages);
    if (!userText) throw new ValidationError("A user message is required");

    const conversation = await resolveConversation(workspaceId, input.conversationId, userText);
    await createMessageRecord({
        conversationId: conversation.id,
        role: "USER",
        content: userText,
    });

    const [retrievedChunks, userMemories] = await Promise.all([
        retrieveWorkspaceContext(workspaceId, userText),
        searchUserMemories(userId, userText),
    ]);

    const citations = retrievedChunks.map((chunk: any) => ({
        sourceId: chunk.sourceId,
        sourceTitle: chunk.sourceTitle,
        sourceType: chunk.sourceType,
        chunkId: chunk.chunkId,
        page: chunk.page,
        excerpt: chunk.text.slice(0, 280),
        score: chunk.score
    }));
    const systemPrompt = buildChatSystemPrompt({
        chunks: retrievedChunks,
        conversationSummary: conversation.summary,
        userMemories: userMemories.map((memory: any) => memory.memory),
        webSearchEnabled,
    });

    const contextMessages =
        conversation.summary &&
            input.messages.length > RECENT_MESSAGE_WINDOW
            ? input.messages.slice(-RECENT_MESSAGE_WINDOW)
            : input.messages;

    let webSearchResults: TavilySearchResponse | null = null;

    const stream = createUIMessageStream({
        originalMessages: input.messages,
        execute: async ({ writer }) => {
            const tools =
                webSearchEnabled
                    ? {
                        web_search: tool({
                            description:
                                "Search the web for up-to-date information outside the workspace sources.",
                            inputSchema: z.object({
                                query: z
                                    .string()
                                    .describe(
                                        "The search query for current web information",
                                    ),
                            }),
                            execute: async ({ query }) => {
                                const results = await searchWeb(query);
                                webSearchResults = results;
                                return formatTavilyResultsForPrompt(results);
                            },
                        }),
                    }
                    : undefined;

            const result = streamText({
                model: openai(chatModel),
                system: systemPrompt,
                messages: await convertToModelMessages(contextMessages),
                tools,
                stopWhen: webSearchEnabled ? isStepCount(3) : undefined,
            });

            writer.merge(toUIMessageStream({ stream: result.stream }));
        },
        onFinish: async ({ responseMessage, isAborted }) => {
            if (isAborted) {
                return;
            }

            const assistantText = getTextFromUIMessage(responseMessage).trim();
            if (!assistantText) {
                return;
            }

            const webCitations = webSearchResults
                ? webSearchResults.results.map((result) => ({
                    sourceType: "WEB" as const,
                    sourceTitle: result.title,
                    url: result.url,
                    excerpt: result.content.slice(0, 280),
                }))
                : [];
            const allCitations = [...citations, ...webCitations];

            await createMessageRecord({
                conversationId: conversation.id,
                role: "ASSISTANT",
                content: assistantText,
                citations: allCitations,
            });

            await touchConversation(conversation.id);

            if (!conversation.title) {
                await updateConversationRecord(conversation.id, {
                    title: buildConversationTitle(userText),
                });
            }

            const messageCount = await countMessagesByConversationId(
                conversation.id,
            );

            if (messageCount % CONVERSATION_SUMMARY_INTERVAL === 0) {
                await enqueueConversationSummarize({
                    conversationId: conversation.id,
                    userId,
                });
            }

            void addMemoriesFromMessages(
                userId,
                [
                    { role: "user", content: userText },
                    { role: "assistant", content: assistantText },
                ],
                {
                    source: "learned",
                    conversationId: conversation.id,
                },
            ).catch((error) => {
                console.error("Mem0 add failed:", error);
            });
        },
    });

    await pipeUIMessageStreamToResponse({
        response: res,
        stream,
        headers: {
            "X-Conversation-Id": conversation.id,
        },
    });
}