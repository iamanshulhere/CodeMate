import express from "express";
import {
  createDeveloperProfile,
  deleteMyDeveloperProfile,
  getDeveloperProfileById,
  getDeveloperProfiles,
  getMyDeveloperProfile,
  updateMyDeveloperProfile
} from "../controllers/developerProfileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getDeveloperProfiles).post(protect, createDeveloperProfile);
router
  .route("/me")
  .get(protect, getMyDeveloperProfile)
  .put(protect, updateMyDeveloperProfile)
  .delete(protect, deleteMyDeveloperProfile);
router.get("/:id", getDeveloperProfileById);

export default router;
