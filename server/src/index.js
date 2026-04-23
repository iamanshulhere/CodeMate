import dotenv from "dotenv";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeChatSocket } from "./sockets/chatSocket.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const envPath = path.resolve(currentDir, "../.env");

dotenv.config({ path: envPath });

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://127.0.0.1:5173";

const startServer = async () => {
  try {
    console.log("[server] Loading environment from:", envPath);
    console.log("[server] CLIENT_URL:", CLIENT_URL);
    console.log("[server] MONGODB_URI loaded:", Boolean(process.env.MONGODB_URI));

    await connectDB();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    initializeChatSocket(io);

    server.on("error", (error) => {
      console.error("[server] HTTP server error:", error.message);
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`[server] Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[server] Server startup failed:", error.message);
    process.exit(1);
  }
};

process.on("unhandledRejection", (error) => {
  console.error("[server] Unhandled promise rejection:", error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("[server] Uncaught exception:", error);
  process.exit(1);
});

startServer();
