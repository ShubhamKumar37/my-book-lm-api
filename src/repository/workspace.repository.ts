import { prisma } from "../lib/db.js";
import { CreateWorkspaceInput, UpdateWorkspaceInput } from "../validators/workspace.validator.js";

export const workspaceSelect = {
    id: true,
    title: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    icon: true,
    userId: true,
    defaultModel: true,
} as const;

export type workspaceRecord = {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    defaultModel: string;
    createdAt: Date;
    updatedAt: Date;
};

export async function findWorkspacesByUserId(userId: string) {
    const workspaces = await prisma.workspace.findMany({
        where: {
            userId: userId
        },
        select: workspaceSelect,
        orderBy: { updatedAt: "desc" }
    });

    return workspaces;
}

export async function findWorkspaceByIdAndUserId(workspaceId: string, userId: string) {
    const workspace = await prisma.workspace.findFirst({
        where: {
            userId: userId,
            id: workspaceId
        },
        select: workspaceSelect
    });

    return workspace;
}

export async function createWorkspace(userId: string, data: CreateWorkspaceInput) {
    const newWorkspace = await prisma.workspace.create({
        data: {
            ...data,
            userId: userId
        },
        select: workspaceSelect
    });

    return newWorkspace;
}

export async function updateWorkspace(workspaceId: string, data: UpdateWorkspaceInput) {
    const updatedWorkspace = await prisma.workspace.update({
        where: {
            id: workspaceId
        },
        data: data,
        select: workspaceSelect
    });

    return updatedWorkspace;
}

export async function deleteWorkspace(workspaceId: string) {
    await prisma.workspace.delete({
        where: {
            id: workspaceId
        }
    });
}