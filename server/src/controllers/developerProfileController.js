import mongoose from "mongoose";
import DeveloperProfile from "../models/DeveloperProfile.js";
import User from "../models/User.js";

const populateUser = "name email role";
const normalizeSignal = (value) => value?.toString().trim() || "";
const uniqueSignals = (items = []) =>
  [...new Set(items.map(normalizeSignal).filter(Boolean))];

const buildUserSignalPayload = (profile) => ({
  skills: uniqueSignals((profile.skills || []).map((skill) => skill.name)),
  techStack: uniqueSignals(
    (profile.techStack || []).flatMap((item) => item.technologies || [])
  ),
  interests: uniqueSignals(profile.interests || [])
});

const syncUserSignals = async (userId, profile) => {
  await User.findByIdAndUpdate(userId, buildUserSignalPayload(profile));
};

const assignProfileFields = (profile, payload) => {
  const allowedFields = [
    "headline",
    "bio",
    "location",
    "totalExperienceYears",
    "skills",
    "interests",
    "techStack",
    "experience",
    "socialLinks",
    "availability"
  ];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      profile[field] = payload[field];
    }
  }
};

export const createDeveloperProfile = async (req, res) => {
  try {
    const existingProfile = await DeveloperProfile.findOne({ user: req.user._id });

    if (existingProfile) {
      res.status(409).json({ message: "Developer profile already exists" });
      return;
    }

    const profile = new DeveloperProfile({ user: req.user._id });
    assignProfileFields(profile, req.body);

    const savedProfile = await profile.save();
    await syncUserSignals(req.user._id, savedProfile);
    await savedProfile.populate("user", populateUser);

    res.status(201).json(savedProfile);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create developer profile",
      error: error.message
    });
  }
};

export const getMyDeveloperProfile = async (req, res) => {
  try {
    const profile = await DeveloperProfile.findOne({ user: req.user._id }).populate(
      "user",
      populateUser
    );

    if (!profile) {
      res.status(404).json({ message: "Developer profile not found" });
      return;
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch developer profile",
      error: error.message
    });
  }
};

export const getDeveloperProfiles = async (_req, res) => {
  try {
    const profiles = await DeveloperProfile.find()
      .populate("user", populateUser)
      .sort({ createdAt: -1 });

    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch developer profiles",
      error: error.message
    });
  }
};

export const getDeveloperProfileById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ message: "Invalid developer profile id" });
    return;
  }

  try {
    const profile = await DeveloperProfile.findById(req.params.id).populate(
      "user",
      populateUser
    );

    if (!profile) {
      res.status(404).json({ message: "Developer profile not found" });
      return;
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch developer profile",
      error: error.message
    });
  }
};

export const updateMyDeveloperProfile = async (req, res) => {
  try {
    const profile = await DeveloperProfile.findOne({ user: req.user._id });

    if (!profile) {
      res.status(404).json({ message: "Developer profile not found" });
      return;
    }

    assignProfileFields(profile, req.body);
    const updatedProfile = await profile.save();
    await syncUserSignals(req.user._id, updatedProfile);
    await updatedProfile.populate("user", populateUser);

    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update developer profile",
      error: error.message
    });
  }
};

export const deleteMyDeveloperProfile = async (req, res) => {
  try {
    const profile = await DeveloperProfile.findOne({ user: req.user._id });

    if (!profile) {
      res.status(404).json({ message: "Developer profile not found" });
      return;
    }

    await profile.deleteOne();
    await User.findByIdAndUpdate(req.user._id, {
      skills: [],
      techStack: [],
      interests: []
    });

    res.status(200).json({ message: "Developer profile deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete developer profile",
      error: error.message
    });
  }
};
