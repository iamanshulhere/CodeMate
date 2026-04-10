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

router.use(protect);

router.route("/").get(getDeveloperProfiles).post(createDeveloperProfile);
router
  .route("/me")
  .get(getMyDeveloperProfile)
  .put(updateMyDeveloperProfile)
  .delete(deleteMyDeveloperProfile);
router.get("/:id", getDeveloperProfileById);

export default router;
