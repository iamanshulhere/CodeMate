import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      default: "developer"
    },
    avatarUrl: {
      type: String,
      trim: true
    },
    skills: [
      {
        type: String,
        trim: true
      }
    ],
    techStack: [
      {
        type: String,
        trim: true
      }
    ],
    interests: [
      {
        type: String,
        trim: true
      }
    ],
    isOnline: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ skills: 1 });
userSchema.index({ techStack: 1 });
userSchema.index({ interests: 1 });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
