import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";

const getUserRoom = (userId) => `user:${userId}`;

const buildConversationId = (leftUserId, rightUserId) =>
  [String(leftUserId), String(rightUserId)].sort().join(":");

const extractToken = (socket) => {
  const authToken = socket.handshake.auth?.token;

  if (authToken) {
    return authToken;
  }

  const authHeader = socket.handshake.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

const authenticateSocket = async (socket, next) => {
  const token = extractToken(socket);

  if (!token) {
    console.error("[socket] Missing auth token during handshake");
    next(new Error("Authentication failed: token missing"));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.error("[socket] Auth failed - user not found:", decoded.userId);
      next(new Error("Authentication failed: user not found"));
      return;
    }

    socket.user = user;
    console.log("[socket] Authenticated user:", String(user._id));
    next();
  } catch (error) {
    console.error("[socket] Auth failed - invalid token:", error.message);
    next(new Error("Authentication failed: invalid token"));
  }
};

export const initializeChatSocket = (io) => {
  console.log("[socket] Initializing Socket.IO handlers");
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const currentUserId = String(socket.user._id);
    const currentUserRoom = getUserRoom(currentUserId);

    console.log("[socket] Client connected:", {
      socketId: socket.id,
      userId: currentUserId
    });

    socket.join(currentUserRoom);
    socket.emit("chat:ready", {
      userId: currentUserId,
      room: currentUserRoom
    });

    socket.on("chat:join", ({ targetUserId } = {}) => {
      if (!targetUserId) {
        console.warn("[socket] chat:join missing targetUserId");
        socket.emit("chat:error", {
          message: "targetUserId is required to join a private room"
        });
        return;
      }

      const conversationId = buildConversationId(currentUserId, targetUserId);
      const room = `chat:${conversationId}`;
      socket.join(room);

      socket.emit("chat:joined", {
        room,
        conversationId,
        participants: [currentUserId, String(targetUserId)].sort()
      });

      console.log("[socket] Joined conversation:", {
        socketId: socket.id,
        userId: currentUserId,
        targetUserId: String(targetUserId),
        conversationId
      });
    });

    socket.on("chat:typing", ({ targetUserId, isTyping = false } = {}) => {
      if (!targetUserId) {
        console.warn("[socket] chat:typing missing targetUserId");
        return;
      }

      io.to(getUserRoom(targetUserId)).emit("chat:typing", {
        fromUserId: currentUserId,
        isTyping: Boolean(isTyping)
      });
    });

    socket.on("chat:message", async ({ targetUserId, text } = {}) => {
      if (!targetUserId || !text?.trim()) {
        console.warn("[socket] chat:message invalid payload", {
          targetUserId,
          hasText: Boolean(text?.trim())
        });
        socket.emit("chat:error", {
          message: "targetUserId and non-empty text are required"
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        console.warn("[socket] chat:message invalid target user id:", targetUserId);
        socket.emit("chat:error", {
          message: "targetUserId is invalid"
        });
        return;
      }

      const targetUser = await User.findById(targetUserId).select("_id");

      if (!targetUser) {
        console.warn("[socket] chat:message target user not found:", targetUserId);
        socket.emit("chat:error", {
          message: "Target user not found"
        });
        return;
      }

      const conversationId = buildConversationId(currentUserId, targetUserId);
      try {
        const savedMessage = await Message.create({
          sender: currentUserId,
          receiver: targetUserId,
          conversationId,
          text: text.trim()
        });

        const payload = {
          id: String(savedMessage._id),
          conversationId,
          fromUserId: currentUserId,
          toUserId: String(targetUserId),
          text: savedMessage.text,
          sentAt: savedMessage.createdAt.toISOString()
        };

        console.log("[socket] Message saved and emitted:", {
          conversationId,
          fromUserId: currentUserId,
          toUserId: String(targetUserId),
          messageId: String(savedMessage._id)
        });

        io.to(currentUserRoom).emit("chat:message", payload);
        io.to(getUserRoom(targetUserId)).emit("chat:message", payload);
      } catch (error) {
        console.error("[socket] Failed to save message:", error.message);
        socket.emit("chat:error", {
          message: "Failed to save message"
        });
      }
    });

    socket.on("call:initiate", ({ targetUserId } = {}) => {
      if (!targetUserId) {
        socket.emit("call:error", { message: "targetUserId is required" });
        return;
      }

      io.to(getUserRoom(targetUserId)).emit("call:incoming", {
        fromUserId: currentUserId
      });
    });

    socket.on("call:accept", ({ targetUserId } = {}) => {
      if (!targetUserId) {
        socket.emit("call:error", { message: "targetUserId is required" });
        return;
      }

      io.to(getUserRoom(targetUserId)).emit("call:accepted", {
        fromUserId: currentUserId
      });
    });

    socket.on("call:reject", ({ targetUserId } = {}) => {
      if (!targetUserId) {
        socket.emit("call:error", { message: "targetUserId is required" });
        return;
      }

      io.to(getUserRoom(targetUserId)).emit("call:rejected", {
        fromUserId: currentUserId
      });
    });

    socket.on("call:offer", ({ targetUserId, offer } = {}) => {
      if (!targetUserId || !offer) {
        socket.emit("call:error", {
          message: "targetUserId and offer are required"
        });
        return;
      }

      io.to(getUserRoom(targetUserId)).emit("call:offer", {
        fromUserId: currentUserId,
        offer
      });
    });

    socket.on("call:answer", ({ targetUserId, answer } = {}) => {
      if (!targetUserId || !answer) {
        socket.emit("call:error", {
          message: "targetUserId and answer are required"
        });
        return;
      }

      io.to(getUserRoom(targetUserId)).emit("call:answer", {
        fromUserId: currentUserId,
        answer
      });
    });

    socket.on("call:ice-candidate", ({ targetUserId, candidate } = {}) => {
      if (!targetUserId || !candidate) {
        socket.emit("call:error", {
          message: "targetUserId and candidate are required"
        });
        return;
      }

      io.to(getUserRoom(targetUserId)).emit("call:ice-candidate", {
        fromUserId: currentUserId,
        candidate
      });
    });

    socket.on("call:end", ({ targetUserId } = {}) => {
      if (!targetUserId) {
        socket.emit("call:error", { message: "targetUserId is required" });
        return;
      }

      io.to(getUserRoom(targetUserId)).emit("call:ended", {
        fromUserId: currentUserId
      });
      io.to(currentUserRoom).emit("call:ended", {
        fromUserId: currentUserId
      });
    });

    socket.on("disconnect", () => {
      console.log("[socket] Client disconnected:", {
        socketId: socket.id,
        userId: currentUserId
      });
      socket.leave(currentUserRoom);
    });
  });
};
