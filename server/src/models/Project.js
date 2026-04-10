import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    dueDate: {
      type: Date
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  {
    _id: false
  }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "review", "done"],
      default: "todo"
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    dueDate: {
      type: Date
    }
  },
  {
    timestamps: true,
    _id: false
  }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    techStack: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed"],
      default: "planning"
    },
    visibility: {
      type: String,
      enum: ["private", "team", "public"],
      default: "private"
    },
    milestones: [milestoneSchema],
    tasks: [taskSchema],
    repositoryUrl: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
