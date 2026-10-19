
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db.js";
import { dash } from "@better-auth/infra";

const clientUrl = (
    process.env.CLIENT_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const auth = betterAuth({
    plugins: [dash()],
    // Backend URL where Better Auth runs
    baseURL: (
        process.env.BETTER_AUTH_URL || "http://localhost:5000"
    ).replace(/\/+$/, ""),

    secret: process.env.BETTER_AUTH_SECRET,

    // Frontend origins allowed to make auth requests
    trustedOrigins: [
        clientUrl,
        "https://my-book-lm-web.vercel.app",
        "http://localhost:3000",
    ],

    // Resolve client IP for rate limiting
    advanced: {
        ipAddress: {
            ipAddressHeaders: ["x-forwarded-for"],
        },
    },

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
