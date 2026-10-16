
import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

import {
    createConversation,
    deleteConversation,
    listConversations,
    updateConversation,
} from "../controllers/conversation.controller.js";

const conversationRoutes = Router();

conversationRoutes.use(requireAuth);

conversationRoutes.get(
    "/:workspaceId",
    asyncHandler(listConversations),
);

conversationRoutes.post(
    "/:workspaceId",
    asyncHandler(createConversation),
);

conversationRoutes.patch(
    "/:workspaceId/:conversationId",
    asyncHandler(updateConversation),
);

conversationRoutes.delete(
    "/:workspaceId/:conversationId",
    asyncHandler(deleteConversation),
);

export { conversationRoutes };
