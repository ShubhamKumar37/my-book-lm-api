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

const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

// CORS MUST come before Better Auth routes
app.use(
    cors({
        origin: clientUrl,
        credentials: true,
    })
);

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

registerRoutes(app);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
