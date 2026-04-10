import DeveloperProfile from "../models/DeveloperProfile.js";
import { matchDevelopers } from "../services/matchmakingService.js";

export const getTopMatches = async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit =
    Number.isNaN(requestedLimit) || requestedLimit <= 0
      ? 5
      : Math.min(requestedLimit, 20);

  try {
    const currentProfile = await DeveloperProfile.findOne({
      user: req.user._id
    }).populate("user", "name email role");

    if (!currentProfile) {
      res.status(404).json({
        message: "Developer profile not found for the logged-in user"
      });
      return;
    }

    const candidateProfiles = await DeveloperProfile.find({
      user: { $ne: req.user._id }
    }).populate("user", "name email role");

    const matches = matchDevelopers(currentProfile, candidateProfiles, limit).map(
      (match) => {
        const matchedProfile = candidateProfiles.find(
          (profile) => String(profile._id) === String(match.profileId)
        );

        return {
          ...match,
          developer: matchedProfile
            ? {
                profileId: matchedProfile._id,
                userId: matchedProfile.user?._id,
                name: matchedProfile.user?.name,
                email: matchedProfile.user?.email,
                role: matchedProfile.user?.role,
                headline: matchedProfile.headline,
                location: matchedProfile.location,
                availability: matchedProfile.availability
              }
            : null
        };
      }
    );

    res.status(200).json({
      count: matches.length,
      matches
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch developer matches",
      error: error.message
    });
  }
};
