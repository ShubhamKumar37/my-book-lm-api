import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client.js"

type ClientMap = Map<string, PrismaClient>

const globalAny: any = globalThis as any

if (!globalAny.__PRISMA_POOL__) {
    globalAny.__PRISMA_POOL__ = new Map()
}

const prismaPool: ClientMap = globalAny.__PRISMA_POOL__

export function getPrisma(clientId = "default"): PrismaClient {
    if (prismaPool.has(clientId)) {
        return prismaPool.get(clientId) as PrismaClient
    }

    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
    })

    const prisma = new PrismaClient({
        adapter,
        log: ["query", "info", "warn", "error"],
    })

    prismaPool.set(clientId, prisma)

    return prisma
}

export async function disconnectPrisma(clientId?: string) {
    if (clientId) {
        const p = prismaPool.get(clientId)

        if (p) {
            await p.$disconnect().catch(() => {})
            prismaPool.delete(clientId)
        }

        return
    }

    const entries = Array.from(prismaPool.entries())

    await Promise.all(
        entries.map(([, p]) => p.$disconnect().catch(() => {}))
    )

    prismaPool.clear()
}

export function listPrismaClients() {
    return Array.from(prismaPool.keys())
}

export default getPrisma

export const prisma = getPrisma()