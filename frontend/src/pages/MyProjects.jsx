import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import api  from '../services/api.js'

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await api.get("api/project/my-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to fetch projects");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#1a1a2e] text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">My Projects</h2>
      {loading ? (
        <p className="text-gray-400">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-500">No projects found.</p>
      ) : (
        <ul className="space-y-4">
          {projects.map((project) => (
            <li
              key={project._id}
              className="border border-[#2d2d3e] p-4 rounded-lg bg-[#121222]"
            >
              <h3 className="text-lg font-bold text-indigo-400">{project.name}</h3>
              <p className="text-sm text-gray-400 mt-2">Collaborators:</p>
              <ul className="ml-4 mt-1 text-sm text-gray-300 list-disc">
                {project.users.map((user) => (
                  <li key={user._id}>
                    {user.name} ({user.email})
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
