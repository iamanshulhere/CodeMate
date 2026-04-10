import mongoose from "mongoose";
import Message from "../models/Message.js";

const buildConversationId = (leftUserId, rightUserId) =>
  [String(leftUserId), String(rightUserId)].sort().join(":");

export const getConversationMessages = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  try {
    const conversationId = buildConversationId(req.user._id, userId);
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .select("sender receiver text createdAt conversationId");

    res.status(200).json({
      conversationId,
      messages
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch messages",
      error: error.message
    });
  }
};
