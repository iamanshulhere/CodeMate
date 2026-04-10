import express from "express";
import { getConversationMessages } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:userId", protect, getConversationMessages);

export default router;
