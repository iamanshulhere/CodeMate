import cors from "cors";
import express from "express";
import { getAllowedOrigins, isAllowedOrigin } from "./config/origins.js";
import authRoutes from "./routes/authRoutes.js";
import developerProfileRoutes from "./routes/developerProfileRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json());

console.log("[app] Allowed CORS origins:", getAllowedOrigins().join(", "));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "CodeMate API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", developerProfileRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

export default app;
