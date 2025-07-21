const Project = require("../models/Project");
const User = require("../models/User");
const Version = require("../models/Version");
const { v4: uuidv4 } = require("uuid");

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { name, collaboratorEmail } = req.body;
    const creator = await User.findById(req.user.id);
    const collaborator = collaboratorEmail
      ? await User.findOne({ email: collaboratorEmail })
      : null;

    const users = [creator._id];
    if (collaborator) users.push(collaborator._id);

    const project = await Project.create({
      name,
      users,
      files: [
        {
          id: uuidv4(),
          name: "App.js",
          type: "file",
          content: "// Start coding here!",
        },
      ],
    });

    res.status(201).json(project);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all projects
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ users: req.user.id }).populate(
      "users",
      "name email"
    );
    res.json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.users.includes(req.user.id))
      return res.status(403).json({ message: "Access denied" });
    res.json(project);
  } catch (err) {
    console.error("Error getting project:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update files & save versions
exports.updateFiles = async (req, res) => {
  try {
    const { files } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.users.includes(req.user.id))
      return res.status(403).json({ message: "Access denied" });

    // Save version for each file
    for (const file of files) {
      if (file.type === "file") {
        await Version.create({
          projectId: project._id,
          fileName: file.name,
          content: file.content || "",
        });
      }
    }

    project.files = files;
    await project.save();
    res.json({ message: "Files updated & versioned." });
  } catch (err) {
    console.error("Error updating files:", err);
    res.status(500).json({ message: err.message });
  }
};

// In projectController.js (fix sorting key)
exports.getProjectHistory = async (req, res) => {
  try {
    const versions = await Version.find({ projectId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(versions);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ message: err.message });
  }
};


// Rollback to a version
exports.rollbackVersion = async (req, res) => {
  try {
    const version = await Version.findById(req.params.versionId);
    if (!version) return res.status(404).json({ message: "Version not found" });

    const project = await Project.findById(version.projectId);
    if (!project.users.includes(req.user.id))
      return res.status(403).json({ message: "Access denied" });

    project.files = project.files.map((file) =>
      file.name === version.fileName ? { ...file, content: version.content } : file
    );
    await project.save();

    res.json({ message: "Rolled back successfully", file: version });
  } catch (err) {
    console.error("Error rolling back:", err);
    res.status(500).json({ message: err.message });
  }
};
