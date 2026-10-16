import { MemoryClient } from "mem0ai";

let client: MemoryClient | null = null;

export function getMem0Client() {
    const apiKey = process.env.MEM0_API_KEY?.trim();

    if (!apiKey) {
        throw new Error("MEM0_API_KEY is not configured");
    }

    if (!client) {
        client = new MemoryClient({ apiKey });
    }

    return client;
}

export type Mem0Message = {
    role: "user" | "assistant";
    content: string;
};

export type AppMemory = {
    id: string;
    memory: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown> | null;
    categories?: string[];
    source: "manual" | "learned";
};

function mapMemory(record: {
    id: string,
    memory?: string,
    createdAt?: Date | null,
    updatedAt?: Date | null,
    metadata?: Record<string, unknown> | null,
    categories?: string[]
}): AppMemory {
    const metadata = record.metadata ?? null;
    const source: AppMemory["source"] = metadata?.source === "manual" ? "manual" : "learned";
    const createdAt = record.createdAt ?? new Date().toISOString();
    const updatedAt = record.createdAt ?? createdAt;

    return {
        id: record.id,
        memory: record.memory ?? "",
        createdAt:
            createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        updatedAt:
            updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt,
        metadata,
        categories: record.categories,
        source,
    };
}

export async function listUserMemories(userId: string) {
    if (!process.env.MEM0_API_KEY?.trim()) {
        return [];
    }

    const page = await getMem0Client().getAll({
        filters: { user_id: userId },
        page: 1,
        pageSize: 100,
    });

    return page.results.map(mapMemory);
}

export async function searchUserMemories(userId: string, query: string) {
    if (!process.env.MEM0_API_KEY?.trim() || !query.trim()) {
        return [];
    }

    const results = await getMem0Client().search(query, {
        filters: { user_id: userId },
        topK: 8,
        threshold: 0.1,
    });

    return results.results.map(mapMemory);
}

export async function addUserMemory(userId: string, input: { memory: string, infer: boolean, metadata: Record<string, unknown> }) {
    const created = await getMem0Client().add([{ role: "user", content: input.memory }], { userId, infer: input?.infer ?? false, metadata: input.metadata });

    const first = created[0];
    if (!first) throw new Error("Mem0 didn't created a memeory");

    return mapMemory(first);
}

export async function addMemoriesFromMessages(
    userId: string,
    messages: Mem0Message[], 
    metadata?: Record<string, unknown>,
) {
    if (!process.env.MEM0_API_KEY?.trim() || messages.length === 0) {
        return;
    }

    await getMem0Client().add(messages, {
        userId,
        infer: true,
        metadata,
    });
}

export async function deleteUserMemory(memoryId: string) {
    await getMem0Client().delete(memoryId);
}

export async function updateUserMemory(
    memoryId: string,
    input: { memory: string },
) {
    const updated = await getMem0Client().update(memoryId, {
        text: input.memory,
    });

    const first = updated[0];
    if (!first) {
        throw new Error("Mem0 did not return an updated memory");
    }

    return mapMemory(first);
}