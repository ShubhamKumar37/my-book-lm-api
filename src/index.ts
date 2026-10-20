import express from "express";
import "dotenv/config";

import cors from "cors";
import { config } from "./config.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { registerRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { functions } from "./inngest/index.js";

const PORT = process.env.PORT;

const app = express();

const clientUrl = (
    process.env.CLIENT_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

// CORS MUST come before Better Auth routes
app.use(
    cors({
        origin: clientUrl,
        credentials: true,
    })
);

app.use("/api/auth", (req, res, next) => {
    const cookieHeader = req.headers.cookie;

    // Log cookie names only. Never log cookie values.
    const cookieNames = cookieHeader
        ? cookieHeader
            .split(";")
            .map((cookie) => cookie.trim().split("=")[0])
        : [];

    console.log("[Auth Cookie Debug]", {
        method: req.method,
        path: req.path,
        origin: req.headers.origin,
        cookieHeaderPresent: Boolean(cookieHeader),
        cookieNames,
    });

    next();
});

// Better Auth
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.use(
    "/api/inngest",
    serve({
        client: inngest,
        functions,
    })
);


app.get("/debug/session", async (req, res) => {
    try {
        const cookieHeader = req.headers.cookie;

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        console.log("[Session Debug]", {
            cookieHeaderPresent: Boolean(cookieHeader),
            hasSession: Boolean(session?.session),
            hasUser: Boolean(session?.user),
            userId: session?.user?.id ?? null,
        });

        res.json({
            cookieHeaderPresent: Boolean(cookieHeader),
            hasSession: Boolean(session?.session),
            hasUser: Boolean(session?.user),
        });
    } catch (error) {
        console.error("[Session Debug] Error:", error);
        res.status(500).json({ error: "Session diagnostic failed" });
    }
});


registerRoutes(app);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
