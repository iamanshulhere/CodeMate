import express from "express";
import {
  sendConnectionRequest,
  getConnections,
  getConnectionRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest
} from "../controllers/connectionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/request/:userId", protect, sendConnectionRequest);
router.get("/", protect, getConnections);
router.get("/requests", protect, getConnectionRequests);
router.patch("/:id/accept", protect, acceptConnectionRequest);
router.patch("/:id/reject", protect, rejectConnectionRequest);
router.delete("/:id", protect, cancelConnectionRequest);

export default router;
