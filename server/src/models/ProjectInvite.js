import mongoose from "mongoose";

const projectInviteSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

projectInviteSchema.index({ projectId: 1, sender: 1, receiver: 1 }, { unique: true });

const ProjectInvite = mongoose.model("ProjectInvite", projectInviteSchema);

export default ProjectInvite;
