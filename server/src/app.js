import cors from "cors";
import express from "express";
import userRoutes from "./routes/userRoutes.js";

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

app.use("/api/users", userRoutes);

export default app;
