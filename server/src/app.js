import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "CodeMate API is running" });
});

app.use("/api/auth", authRoutes);

export default app;
