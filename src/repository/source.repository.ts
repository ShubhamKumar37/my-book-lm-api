import { Prisma } from "../generated/prisma/client.js"
import { prisma } from "../lib/db.js";
import { ListSourcesQuery } from "../validators/source.validator.js";

export const sourceSelect = {
    id: true,
    workspaceId: true,
    type: true,
    title: true,
    content: true,
    url: true,
    status: true,
    metadata: true,
    createdAt: true,
    updatedAt: true,
} as const;

export type createSourceData = {
    title: string,
    workspaceId: string,
    type: SourceRecord["type"],
    url?: string,
    status?: SourceRecord["status"],
    content: string | null,
    metadata?: Prisma.InputJsonValue
}

export type SourceRecord = Prisma.SourceGetPayload<{
    select: typeof sourceSelect
}>;

export async function createSource(data: createSourceData) {
    return await prisma.source.create({
        data: {
            workspaceId: data.workspaceId,
            title: data.title,
            type: data?.type || null,
            content: data.content,
            url: data?.url || null,
            status: data?.status || "PENDING",
            metadata: data?.metadata
        },
        select: sourceSelect
    });
}

export async function findSourcesByWorkspaceId(workspaceId: string, filter: ListSourcesQuery = {}) {
    const where: Prisma.SourceWhereInput = { workspaceId };

    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.q) {
        where.OR = [
            { title: { contains: filter.q, mode: "insensitive" } },
            { content: { contains: filter.q, mode: "insensitive" } }
        ];
    }

    return prisma.source.findMany({
        where,
        select: sourceSelect,
        orderBy: { updatedAt: "desc" }
    });
}

export async function findSourceByIdAndWorkspaceId(sourceId: string, workspaceId: string) {
    return await prisma.source.findFirst({
        where: { id: sourceId, workspaceId: workspaceId },
        select: sourceSelect
    });
}

export async function createSourceRecord(data: createSourceData) {
    return await prisma.source.create({
        data: {
            workspaceId: data.workspaceId,
            type: data.type,
            title: data.title,
            content: data.content ?? null,
            url: data.url ?? null,
            status: data.status ?? "PENDING",
            metadata: data.metadata,
        },
        select: sourceSelect,
    });
}

export async function findSourceById(sourceId: string) {
    return await prisma.source.findUnique({
        where: { id: sourceId },
        select: sourceSelect
    });
}

export async function updateSourceRecord(sourceId: string, data: {
    content?: string | null,
    status?: SourceRecord["status"],
    metadata?: Prisma.InputJsonValue
}) {
    return await prisma.source.update({
        where: { id: sourceId }, 
        data: data, 
        select: sourceSelect
    });
}

export async function deleteSourceRecord(sourceId: string) {
    await prisma.source.delete({
        where: { id: sourceId },
    });
}

