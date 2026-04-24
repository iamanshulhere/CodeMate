import User from "../models/User.js";
import { buildUserMatchQuery, extractUserSignals, matchUsers } from "../services/userMatchService.js";

export const searchUsers = async (req, res) => {
  const query = req.query.q?.trim();

  if (!query) {
    res.status(200).json([]);
    return;
  }

  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    })
      .select("name email role avatarUrl")
      .sort({ name: 1 })
      .limit(10);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to search users",
      error: error.message
    });
  }
};

export const getMatchedUsers = async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit =
    Number.isNaN(requestedLimit) || requestedLimit <= 0
      ? 10
      : Math.min(requestedLimit, 25);

  try {
    const currentUser = await User.findById(req.user._id)
      .select("name email role avatarUrl isOnline skills techStack interests")
      .lean();

    if (!currentUser) {
      res.status(404).json({ message: "Current user not found" });
      return;
    }

    const currentUserSignals = extractUserSignals(currentUser);
    const hasSignals =
      currentUserSignals.skills.length ||
      currentUserSignals.techStack.length ||
      currentUserSignals.interests.length;

    if (!hasSignals) {
      res.status(200).json({
        count: 0,
        matches: [],
        message: "Add skills, tech stack, or interests to get developer matches."
      });
      return;
    }

    const candidateQuery = buildUserMatchQuery(currentUser);
    const candidateUsers = await User.find({
      _id: { $ne: req.user._id },
      ...candidateQuery
    })
      .select("name email role avatarUrl isOnline skills techStack interests")
      .limit(Math.max(limit * 5, 50))
      .lean();

    const matches = matchUsers(currentUser, candidateUsers, limit);

    res.status(200).json({
      count: matches.length,
      matches
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch matched users",
      error: error.message
    });
  }
};
