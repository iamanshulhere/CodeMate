import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Force load .env

import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeChatSocket } from "./sockets/chatSocket.js";

/* =========================
   Debug ENV (REMOVE LATER)
========================= */
console.log("ENV CHECK MONGODB_URI:", process.env.MONGODB_URI);

/* =========================
   Port Configuration
========================= */
const PORT = process.env.PORT || 5000;

/* =========================
   Start Server Function
========================= */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });

    // Initialize chat sockets
    initializeChatSocket(io);

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

/* =========================
   Run Server
========================= */
startServer();