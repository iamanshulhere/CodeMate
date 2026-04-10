import mongoose from "mongoose";

/* =========================
   Skill Schema
========================= */
const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

/* =========================
   Tech Stack Schema
========================= */
const techStackItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true, // e.g. Frontend, Backend, DevOps
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

/* =========================
   Experience Schema
========================= */
const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "freelance", "internship"],
      default: "full-time",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isCurrentRole: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      trim: true,
    },
    achievements: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

/* =========================
   Developer Profile Schema
========================= */
const developerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    headline: {
      type: String,
      trim: true,
      maxlength: 120,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    location: {
      type: String,
      trim: true,
    },

    totalExperienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },

    skills: [skillSchema],

    interests: [
      {
        type: String,
        trim: true,
      },
    ],

    techStack: [techStackItemSchema],

    experience: [experienceSchema],

    socialLinks: {
      github: {
        type: String,
        trim: true,
      },
      linkedin: {
        type: String,
        trim: true,
      },
      portfolio: {
        type: String,
        trim: true,
      },
    },

    availability: {
      type: String,
      enum: ["available", "open-to-opportunities", "busy"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   Export Model
========================= */
const DeveloperProfile = mongoose.model(
  "DeveloperProfile",
  developerProfileSchema
);

export default DeveloperProfile;