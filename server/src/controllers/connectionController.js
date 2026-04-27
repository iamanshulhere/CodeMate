import mongoose from "mongoose";
import Connection from "../models/Connection.js";
import User from "../models/User.js";
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

export const sendConnectionRequest = async (req, res) => {
  const senderId = req.user._id;
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (String(senderId) === String(userId)) {
    return res.status(400).json({ message: "You cannot connect with yourself" });
  }

  const receiver = await User.findById(userId).select("name email isOnline");
  if (!receiver) {
    return res.status(404).json({ message: "User not found" });
  }

  const existingConnection = await Connection.findOne({
    $or: [
      { sender: senderId, receiver: userId },
      { sender: userId, receiver: senderId }
    ]
  });

  if (existingConnection) {
    if (existingConnection.status === "accepted") {
      return res.status(409).json({ message: "You are already connected" });
    }

    if (existingConnection.status === "pending") {
      if (String(existingConnection.sender) === String(senderId)) {
        return res.status(409).json({ message: "Connection request already sent" });
      }
      return res.status(409).json({ message: "You already have a pending request from this user" });
    }
  }

  const connection = await Connection.create({ sender: senderId, receiver: userId });

  await createNotification({
    recipient: userId,
    sender: senderId,
    title: "New connection request",
    description: `${req.user.name} wants to connect with you.`,
    type: "connection",
    referenceId: connection._id,
    redirectUrl: "/connections"
  });

  res.status(201).json({ connection });
};

export const getConnections = async (req, res) => {
  const userId = req.user._id;

  const connections = await Connection.find({
    status: "accepted",
    $or: [{ sender: userId }, { receiver: userId }]
  })
    .populate("sender", "name email isOnline")
    .populate("receiver", "name email isOnline");

  const mapped = connections.map((connection) => {
    const otherUser = String(connection.sender._id) === String(userId) ? connection.receiver : connection.sender;
    return {
      connectionId: connection._id,
      userId: otherUser._id,
      name: otherUser.name,
      email: otherUser.email,
      isOnline: otherUser.isOnline,
      connectedAt: connection.updatedAt || connection.createdAt
    };
  });

  res.json({ connections: mapped });
};

export const getConnectionRequests = async (req, res) => {
  const userId = req.user._id;

  const receivedRequests = await Connection.find({ receiver: userId, status: "pending" }).populate(
    "sender",
    "name email isOnline"
  );

  const sentRequests = await Connection.find({ sender: userId, status: "pending" }).populate(
    "receiver",
    "name email isOnline"
  );

  res.json({ receivedRequests, sentRequests });
};

export const acceptConnectionRequest = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid connection request id" });
  }

  const connection = await Connection.findById(id);
  if (!connection) {
    return res.status(404).json({ message: "Connection request not found" });
  }

  if (String(connection.receiver) !== String(userId)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (connection.status !== "pending") {
    return res.status(400).json({ message: "Connection request is no longer pending" });
  }

  connection.status = "accepted";
  await connection.save();

  await createNotification({
    recipient: connection.sender,
    sender: userId,
    title: "Connection accepted",
    description: `${req.user.name} accepted your connection request.",
    type: "connection",
    referenceId: connection._id,
    redirectUrl: "/connections"
  });

  res.json({ connection });
};

export const rejectConnectionRequest = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid connection request id" });
  }

  const connection = await Connection.findById(id);
  if (!connection) {
    return res.status(404).json({ message: "Connection request not found" });
  }

  if (String(connection.receiver) !== String(userId)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (connection.status !== "pending") {
    return res.status(400).json({ message: "Connection request is no longer pending" });
  }

  connection.status = "rejected";
  await connection.save();

  res.json({ connection });
};

export const cancelConnectionRequest = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid connection request id" });
  }

  const connection = await Connection.findById(id);
  if (!connection) {
    return res.status(404).json({ message: "Connection request not found" });
  }

  if (String(connection.sender) !== String(userId)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (connection.status !== "pending") {
    return res.status(400).json({ message: "Only pending requests can be cancelled" });
  }

  await connection.remove();
  res.json({ message: "Connection request cancelled" });
};
