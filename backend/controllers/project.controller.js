import Project from '../models/project.model.js';

export const createProject = async (req, res) => {
    try {
        const { name } = req.body;
        const project = new Project({ name, users: [req.user._id] });
        await project.save();
        res.status(201).json({ project });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addUserToProject = async (req, res) => {
    try {
        const { projectId, users } = req.body;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        project.users.push(...users);
        await project.save();
        res.status(200).json({ project });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('users');
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json({ project });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateFileTree = async (req, res) => {
    try {
        const { projectId, fileTree } = req.body;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        project.fileTree = fileTree;
        await project.save();
        res.status(200).json({ project });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({ users: req.user._id });
        res.status(200).json({ projects });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};