import mongoose from "mongoose";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import { getSocketServer, getUserRoom } from "../sockets/socketManager.js";

export const createProject = async (req, res) => {
  const { title, description, techStack } = req.body;

  if (!title?.trim() || !description?.trim()) {
    res.status(400).json({ message: "Title and description are required." });
    return;
  }

  try {
    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      techStack: Array.isArray(techStack)
        ? techStack.map((item) => item.trim()).filter(Boolean)
        : String(techStack || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
      createdBy: req.user._id,
      members: [req.user._id]
    });

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.status(201).json({ project: populatedProject });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create project",
      error: error.message
    });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message
    });
  }
};

export const joinProject = async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(400).json({ message: "Invalid project id" });
    return;
  }

  try {
    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const userId = req.user._id;
    const memberExists = project.members.some(
      (existingMember) => String(existingMember) === String(userId)
    );

    if (!memberExists) {
      project.members.push(userId);
      await project.save();
    }

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    const io = getSocketServer();
    const creatorId = String(populatedProject.createdBy?._id);
    const currentUserId = String(userId);

    if (io && creatorId && creatorId !== currentUserId) {
      io.to(getUserRoom(creatorId)).emit("notification:project-join", {
        id: `project-join-${project._id}-${Date.now()}`,
        type: "project-join",
        title: "New project member",
        message: `${req.user.name || req.user.email || "A collaborator"} joined ${populatedProject.title}`,
        projectId: project._id,
        fromUserId: currentUserId,
        page: "projects",
        createdAt: new Date().toISOString(),
        read: false
      });

      // Create notification for creator
      try {
        const notification = await Notification.create({
          user: creatorId,
          sender: currentUserId,
          type: "project",
          content: `${req.user.name || req.user.email || "A collaborator"} joined your project "${populatedProject.title}"`,
          referenceId: project._id,
          redirectUrl: "/projects"
        });
        io.to(getUserRoom(creatorId)).emit("notification:new", {
          _id: notification._id,
          type: notification.type,
          content: notification.content,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          referenceId: notification.referenceId,
          redirectUrl: notification.redirectUrl
        });
      } catch (notifError) {
        console.error("[project] Failed to create join notification:", notifError.message);
      }
    }

    res.status(200).json({ project: populatedProject });
  } catch (error) {
    res.status(500).json({
      message: "Failed to join project",
      error: error.message
    });
  }
};
