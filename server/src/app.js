import cors from "cors";
import express from "express";
import { getAllowedOrigins, isAllowedOrigin } from "./config/origins.js";
import authRoutes from "./routes/authRoutes.js";
import developerProfileRoutes from "./routes/developerProfileRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";
const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use((req, _res, next) => {
  console.log(`[http] ${req.method} ${req.originalUrl}`);
  next();
});

console.log("[app] Primary frontend origin:", allowedOrigin);
console.log("[app] Allowed CORS origins:", getAllowedOrigins().join(", "));

app.get("/", (_req, res) => {
  res.status(200).send("Backend is running");
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "CodeMate API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", developerProfileRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);

app.use((error, _req, res, _next) => {
  console.error("[app] Request failed:", error.message);
  res.status(500).json({
    message: error.message || "Internal server error"
  });
});

export default app;
