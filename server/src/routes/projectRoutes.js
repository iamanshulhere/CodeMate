import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createProject,
  getProjects,
  joinProject
} from "../controllers/projectController.js";

const router = express.Router();

router.post("/", protect, createProject);
router.get("/", protect, getProjects);
router.post("/join", protect, joinProject);

export default router;
