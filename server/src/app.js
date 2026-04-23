import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import developerProfileRoutes from "./routes/developerProfileRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://127.0.0.1:5173",
    credentials: true
  })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "CodeMate API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", developerProfileRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

export default app;
