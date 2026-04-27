import express from "express";
import {
  sendProjectInvite,
  getProjectInvites,
  acceptProjectInvite,
  rejectProjectInvite
} from "../controllers/projectInviteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/invite/:projectId/:userId", protect, sendProjectInvite);
router.get("/", protect, getProjectInvites);
router.patch("/invite/:id/accept", protect, acceptProjectInvite);
router.patch("/invite/:id/reject", protect, rejectProjectInvite);

export default router;
