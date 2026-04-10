import User from "../models/User.js";

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
