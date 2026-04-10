import jwt from "jsonwebtoken";
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

    socket.on("chat:message", ({ targetUserId, text } = {}) => {
      if (!targetUserId || !text?.trim()) {
        socket.emit("chat:error", {
          message: "targetUserId and non-empty text are required"
        });
        return;
      }

      const conversationId = buildConversationId(currentUserId, targetUserId);
      const payload = {
        conversationId,
        fromUserId: currentUserId,
        toUserId: String(targetUserId),
        text: text.trim(),
        sentAt: new Date().toISOString()
      };

      io.to(currentUserRoom).emit("chat:message", payload);
      io.to(getUserRoom(targetUserId)).emit("chat:message", payload);
    });

    socket.on("disconnect", () => {
      socket.leave(currentUserRoom);
    });
  });
};
