import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db.js";

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

export const auth = betterAuth({
    // Backend URL where Better Auth runs
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",

    secret: process.env.BETTER_AUTH_SECRET,

    // Frontend URL that is allowed to make auth requests
    trustedOrigins: [clientUrl],

    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
});