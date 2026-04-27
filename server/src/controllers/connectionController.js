import mongoose from "mongoose";
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getSocketServer, getUserRoom } from "../sockets/socketManager.js";

/**
 * Create notification + emit via socket
 */
const createNotification = async ({
  recipient,
  sender,
  description,
  type,
  referenceId,
  redirectUrl
}) => {
  const notification = await Notification.create({
    user: recipient,
    sender,
    content: description,
    type,
    referenceId,
    redirectUrl
  });

  const io = getSocketServer();
  const room = getUserRoom(recipient);

  if (io && room) {
    io.to(room).emit("notification:new", notification);
  }

  return notification;
};

/**
 * Send Connection Request
 */
export const sendConnectionRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (String(senderId) === String(userId)) {
      return res.status(400).json({ message: "Cannot connect with yourself" });
    }

    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: userId },
        { sender: userId, receiver: senderId }
      ]
    });

    if (existing) {
      return res.status(409).json({ message: "Connection already exists or pending" });
    }

    const connection = await Connection.create({
      sender: senderId,
      receiver: userId,
      status: "pending"
    });

    await createNotification({
      recipient: userId,
      sender: senderId,
      description: `${req.user.name} sent you a connection request`,
      type: "connection",
      referenceId: connection._id,
      redirectUrl: "/connections"
    });

    res.status(201).json({ connection });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Accept Connection Request
 */
export const acceptConnectionRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const connection = await Connection.findById(id);
    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(connection.receiver) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    connection.status = "accepted";
    await connection.save();

    await createNotification({
      recipient: connection.sender,
      sender: userId,
      description: `${req.user.name} accepted your connection request`,
      type: "connection",
      referenceId: connection._id,
      redirectUrl: "/connections"
    });

    res.json({ connection });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reject Connection Request
 */
export const rejectConnectionRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const connection = await Connection.findById(id);
    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(connection.receiver) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    connection.status = "rejected";
    await connection.save();

    res.json({ message: "Request rejected" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Cancel Sent Request
 */
export const cancelConnectionRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const connection = await Connection.findById(id);
    if (!connection) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (String(connection.sender) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (connection.status !== "pending") {
      return res.status(400).json({ message: "Only pending requests can be cancelled" });
    }

    await connection.deleteOne();

    res.json({ message: "Request cancelled" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Pending Requests
 */
export const getConnectionRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const received = await Connection.find({
      receiver: userId,
      status: "pending"
    }).populate("sender", "name email");

    const sent = await Connection.find({
      sender: userId,
      status: "pending"
    }).populate("receiver", "name email");

    res.json({ received, sent });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Accepted Connections
 */
export const getConnections = async (req, res) => {
  try {
    const userId = req.user._id;

    const connections = await Connection.find({
      status: "accepted",
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    const result = connections.map((c) => {
      const other =
        String(c.sender._id) === String(userId) ? c.receiver : c.sender;

      return {
        connectionId: c._id,
        userId: other._id,
        name: other.name,
        email: other.email
      };
    });

    res.json({ connections: result });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};