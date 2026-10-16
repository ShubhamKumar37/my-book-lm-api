import type { Express } from "express";
import { workspaceRoutes } from "./workspace.route.js";
import { sourceRoutes } from "./source.route.js";
import { conversationRoutes } from "./conversation.route.js";
import chatRoutes from "./chat.route.js";
import { artifactRoutes } from "./artifact.route.js";

export function registerRoutes(app: Express) {
    app.use("/api/workspace", workspaceRoutes);
    app.use("/api/workspace/source", sourceRoutes);
    app.use("/api/workspace/conversation", conversationRoutes);
    app.use("/api/workspace/chat", chatRoutes);
    app.use("/api/workspace/artifact", artifactRoutes);

}