import { io } from "socket.io-client";

export const socketServerUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export function createChatSocket(token) {
  return io(socketServerUrl, {
    auth: {
      token
    },
    transports: ["websocket"]
  });
}
