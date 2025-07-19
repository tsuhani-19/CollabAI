const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User")
const Project = require("../models/Project");
const {
  createProject,
  getMyProjects,
  getProjectById,
  updateFiles,
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

// ✅ Routes
router.post("/create", verifyToken, createProject);
router.get("/my-projects", verifyToken, getMyProjects);
router.get("/:id", verifyToken, getProjectById);             // ✅ Load project by ID
router.put("/:id/files", verifyToken, updateFiles);  

// Add a collaborator to a project
router.post("/add-collaborator", verifyToken, async (req, res) => {
  const { projectId, email } = req.body;

  if (!projectId || !email) {
    return res.status(400).json({ message: "Project ID and Email are required." });
  }

  try {
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: "User not found." });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found." });

    const alreadyAdded = project.users.includes(userToAdd._id);
    if (alreadyAdded) return res.status(400).json({ message: "User already added to this project." });

    project.users.push(userToAdd._id);
    await project.save();

    res.status(200).json({ message: "Collaborator added successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});


module.exports = router;
