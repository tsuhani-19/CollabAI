const Project = require("../models/Project");
const User = require("../models/User");

// Create new project (invite by email)
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
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all projects for logged-in user
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ users: req.user.id }).populate(
      "users",
      "name email"
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
