import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/project/my-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleJoin = (projectId) => {
    socket.connect();
    socket.emit("join-room", { projectId });
    navigate(`/room/${projectId}`);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="p-8 bg-[#0d0d1a] min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-6">My Projects</h2>
      <div className="space-y-4">
        {projects.map((proj) => (
          <div key={proj._id} className="bg-[#1f1f30] p-4 rounded shadow">
            <h3 className="text-lg font-semibold">{proj.name}</h3>
            <p className="text-sm text-gray-400 mb-2">
              Collaborators: {proj.users.map((u) => u.email).join(", ")}
            </p>
            <button
              onClick={() => handleJoin(proj._id)}
              className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-white"
            >
              Join Room
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}