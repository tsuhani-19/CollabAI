const Project = require("../models/Project");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

// Create a new project and invite a collaborator
exports.createProject = async (req, res) => {
  try {
    const { name, collaboratorEmail } = req.body;
    const creator = await User.findById(req.user.id);
    const collaborator = await User.findOne({ email: collaboratorEmail });

    if (!collaborator)
      return res.status(404).json({ message: "User not found" });

    const project = await Project.create({
      name,
      users: [creator._id, collaborator._id],
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

// Get all projects the logged-in user is part of
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

// Get a specific project by ID (and check access)
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ message: "Project not found" });

    if (!project.users.includes(req.user.id))
      return res.status(403).json({ message: "Access denied" });

    res.json(project);
  } catch (err) {
    console.error("Error getting project:", err);
    res.status(500).json({ message: err.message });
  }
};

// Replace entire file/folder structure (if allowed)
exports.updateFiles = async (req, res) => {
  try {
    const { files } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project)
      return res.status(404).json({ message: "Project not found" });

    if (!project.users.includes(req.user.id))
      return res.status(403).json({ message: "Access denied" });

    project.files = files;
    await project.save();

    res.json({ message: "Files updated successfully" });
  } catch (err) {
    console.error("Error updating files:", err);
    res.status(500).json({ message: err.message });
  }
};
