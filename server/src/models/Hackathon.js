import mongoose from "mongoose";

const prizeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      min: 0
    }
  },
  {
    _id: false
  }
);

const hackathonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    organizer: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    theme: {
      type: String,
      trim: true
    },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      default: "online"
    },
    location: {
      type: String,
      trim: true
    },
    registrationDeadline: {
      type: Date
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    teamSizeLimit: {
      type: Number,
      min: 1,
      default: 4
    },
    techThemes: [
      {
        type: String,
        trim: true
      }
    ],
    prizes: [prizeSchema],
    registrationUrl: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["upcoming", "open", "ongoing", "completed"],
      default: "upcoming"
    }
  },
  {
    timestamps: true
  }
);

const Hackathon = mongoose.model("Hackathon", hackathonSchema);

export default Hackathon;
