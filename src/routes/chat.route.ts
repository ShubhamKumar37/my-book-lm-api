import { Router } from "express";
import { getChatMessages, streamChat } from "../controllers/chat.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.post("/:workspaceId", asyncHandler(streamChat));

router.get(
    "/:workspaceId/:conversationId/messages",
    asyncHandler(getChatMessages)
);

export default router;