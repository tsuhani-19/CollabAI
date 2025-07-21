const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Project = require("../models/Project");
const Version = require("../models/Version");  // <-- FIX: Import added
const {
  createProject,
  getMyProjects,
  getProjectById,
  updateFiles,
  getProjectHistory,
  rollbackVersion
} = require("../controller/projectController");

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// Project CRUD
router.post("/create", verifyToken, createProject);
router.get("/my-projects", verifyToken, getMyProjects);
router.get("/:id", verifyToken, getProjectById);
router.put("/:id/files", verifyToken, updateFiles);

// History & Rollback
router.get("/:id/history", verifyToken, getProjectHistory);
router.post("/rollback/:versionId", verifyToken, rollbackVersion);

// Save version snapshot (fixed)
router.post("/save-version", verifyToken, async (req, res) => {
  try {
    const { projectId, files, code } = req.body;
    if (!projectId || !files) {
      return res.status(400).json({ message: "Project ID and files required." });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user.id || req.user._id;  // <-- FIX for JWT payload
    if (!project.users.includes(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const savedVersions = [];
    for (const file of files) {
      if (file.type === "file") {
        const newVersion = await Version.create({
          projectId,
          fileName: file.name,
          content: file.content || "",
          codeSnapshot: code || "",  // <-- include editor state
        });
        savedVersions.push(newVersion);
      }
    }

    res.json({ message: "Version saved successfully", versions: savedVersions });
  } catch (err) {
    console.error("Error saving version:", err);
    res.status(500).json({ message: "Failed to save version" });
  }
});


// Add a collaborator
router.post("/add-collaborator", verifyToken, async (req, res) => {
  const { projectId, email } = req.body;
  if (!projectId || !email)
    return res.status(400).json({ message: "Project ID and Email required." });

  try {
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: "User not found." });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found." });

    if (project.users.includes(userToAdd._id))
      return res.status(400).json({ message: "User already added." });

    project.users.push(userToAdd._id);
    await project.save();

    res.status(200).json({ message: "Collaborator added." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

module.exports = router;
