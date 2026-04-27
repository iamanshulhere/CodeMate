import mongoose from "mongoose";
import ProjectInvite from "../models/ProjectInvite.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import Notification from "../models/Notification.js";
import { getSocketServer, getUserRoom } from "../sockets/socketManager.js";

const createNotification = async ({ recipient, sender, description, type, referenceId, redirectUrl }) => {
  const notification = await Notification.create({
    user: recipient,
    sender,
    content: description,
    type,
    referenceId,
    redirectUrl
  });

  const socketServer = getSocketServer();
  const userRoom = getUserRoom(recipient);
  if (socketServer && userRoom) {
    socketServer.to(userRoom).emit("notification:new", notification);
  }

  return notification;
};

export const sendProjectInvite = async (req, res) => {
  const senderId = req.user._id;
  const { projectId, userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid request parameters" });
  }

  if (String(senderId) === String(userId)) {
    return res.status(400).json({ message: "You cannot invite yourself" });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const isMember = project.members.some((member) => String(member) === String(senderId));
  if (!isMember) {
    return res.status(403).json({ message: "Only project members can invite collaborators" });
  }

  const receiver = await User.findById(userId).select("name email isOnline");
  if (!receiver) {
    return res.status(404).json({ message: "User not found" });
  }

  const existingConnection = await Connection.findOne({
    status: "accepted",
    $or: [
      { sender: senderId, receiver: userId },
      { sender: userId, receiver: senderId }
    ]
  });

  if (!existingConnection) {
    return res.status(403).json({ message: "You can only invite connected users" });
  }

  if (project.members.some((member) => String(member) === String(userId))) {
    return res.status(409).json({ message: "User is already a project member" });
  }

  const existingInvite = await ProjectInvite.findOne({
    projectId,
    sender: senderId,
    receiver: userId,
    status: "pending"
  });

  if (existingInvite) {
    return res.status(409).json({ message: "An invitation has already been sent" });
  }

  const invite = await ProjectInvite.create({ projectId, sender: senderId, receiver: userId });

  await createNotification({
    recipient: userId,
    sender: senderId,
    title: "Project invite received",
    description: `${req.user.name} invited you to join ${project.title}`,
    type: "project_invite",
    referenceId: invite._id,
    redirectUrl: "/projects"
  });

  res.status(201).json({ invite });
};

export const getProjectInvites = async (req, res) => {
  const userId = req.user._id;

  const receivedInvites = await ProjectInvite.find({ receiver: userId, status: "pending" })
    .populate("sender", "name email isOnline")
    .populate("projectId", "title description members");

  const sentInvites = await ProjectInvite.find({ sender: userId, status: "pending" })
    .populate("receiver", "name email isOnline")
    .populate("projectId", "title description members");

  res.json({ receivedInvites, sentInvites });
};

export const acceptProjectInvite = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid invite id" });
  }

  const invite = await ProjectInvite.findById(id).populate("projectId", "title members");
  if (!invite) {
    return res.status(404).json({ message: "Project invite not found" });
  }

  if (String(invite.receiver) !== String(userId)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (invite.status !== "pending") {
    return res.status(400).json({ message: "Project invite is no longer pending" });
  }

  const project = invite.projectId;
  if (!project) {
    return res.status(404).json({ message: "Linked project not found" });
  }

  if (!project.members.some((member) => String(member) === String(userId))) {
    project.members.push(userId);
    await project.save();
  }

  invite.status = "accepted";
  await invite.save();

  await createNotification({
    recipient: invite.sender,
    sender: userId,
    title: "Project invite accepted",
    description: `${req.user.name} accepted your invite to ${project.title}`,
    type: "project_invite",
    referenceId: invite._id,
    redirectUrl: "/projects"
  });

  res.json({ invite });
};

export const rejectProjectInvite = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid invite id" });
  }

  const invite = await ProjectInvite.findById(id);
  if (!invite) {
    return res.status(404).json({ message: "Project invite not found" });
  }

  if (String(invite.receiver) !== String(userId)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (invite.status !== "pending") {
    return res.status(400).json({ message: "Project invite is no longer pending" });
  }

  invite.status = "rejected";
  await invite.save();

  res.json({ invite });
};
