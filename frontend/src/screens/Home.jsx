import React, { useState, useEffect, useContext } from 'react';
import axios from '../config/axios.js';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/Usercontext.jsx';

const Home = () => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axios.get('/projects');
                setProjects(response.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch projects');
            }
        };

        fetchProjects();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/projects/create', { name: projectName });
            setProjects([...projects, res.data]);
            setProjectName('');
            setIsModalOpen(false);
            navigate('/project', { state: { project: res.data } });  // Redirect to project page after creating project
        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.error);
            } else {
                setError('Failed to create project');
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name || 'Guest'}</h1>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200"
            >
                Create New Project
            </button>
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
                        <form onSubmit={handleCreateProject}>
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="projectName">
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    id="projectName"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="Enter project name"
                                    className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200"
                            >
                                Create Project
                            </button>
                            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                        </form>
                    </div>
                </div>
            )}
            <div className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
                <ul>
                    {projects.map((project) => (
                        <li key={project._id} className="mb-2">
                            {project.name}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Home;