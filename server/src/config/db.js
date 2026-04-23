import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing. Check that server/.env exists and is loaded correctly."
    );
  }

  try {
    console.log("[db] Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("[db] MongoDB connected");
  } catch (error) {
    console.error("[db] MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
