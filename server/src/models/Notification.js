import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["message", "project", "match", "connection", "project_invite"],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    redirectUrl: {
      type: String
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;