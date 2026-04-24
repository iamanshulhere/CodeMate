import express from "express";
import { getMatchedUsers, searchUsers } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/match", protect, getMatchedUsers);
router.get("/search", protect, searchUsers);

export default router;
