import jwt from "jsonwebtoken";
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
    next(new Error("Authentication failed: token missing"));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      next(new Error("Authentication failed: user not found"));
      return;
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication failed: invalid token"));
  }
};

export const initializeChatSocket = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const currentUserId = String(socket.user._id);
    const currentUserRoom = getUserRoom(currentUserId);

    socket.join(currentUserRoom);
    socket.emit("chat:ready", {
      userId: currentUserId,
      room: currentUserRoom
    });

    socket.on("chat:join", ({ targetUserId } = {}) => {
      if (!targetUserId) {
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
    });

    socket.on("chat:typing", ({ targetUserId, isTyping = false } = {}) => {
      if (!targetUserId) {
        return;
      }

      io.to(getUserRoom(targetUserId)).emit("chat:typing", {
        fromUserId: currentUserId,
        isTyping: Boolean(isTyping)
      });
    });

    socket.on("chat:message", async ({ targetUserId, text } = {}) => {
      if (!targetUserId || !text?.trim()) {
        socket.emit("chat:error", {
          message: "targetUserId and non-empty text are required"
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

        io.to(currentUserRoom).emit("chat:message", payload);
        io.to(getUserRoom(targetUserId)).emit("chat:message", payload);
      } catch (error) {
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
      socket.leave(currentUserRoom);
    });
  });
};
