import jwt from "jsonwebtoken";
import User from "../models/User.js";

const normalizeEmail = (email) => email?.trim().toLowerCase();
const trimValue = (value) => value?.trim() || "";

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id)
});

const getSignupValidationError = ({ name, email, password }) => {
  if (!trimValue(name) || !trimValue(email) || !trimValue(password)) {
    return "Name, email, and password are required";
  }

  return "";
};

const getLoginValidationError = ({ email, password }) => {
  if (!trimValue(email) || !trimValue(password)) {
    return "Email and password are required";
  }

  return "";
};

export const signupUser = async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const validationError = getSignupValidationError({ name, email, password });

  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password
    });
    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    res.status(400).json({ message: "Signup failed", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const validationError = getLoginValidationError({ email, password });

  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const passwordMatches = await user.matchPassword(password);

    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    res.status(200).json(buildAuthResponse(user));
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
};
