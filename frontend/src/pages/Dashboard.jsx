// ✅ Integrated Dashboard.jsx with Live Chat + Code Sync + Project Sidebar
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    fetchProjects();
    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, { text: msg, type: "other" }]);
    });
    socket.on("receive-code", (newCode) => {
      setCode(newCode);
    });
    return () => socket.disconnect();
  }, []);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/project/my-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err) {
      toast.error("Failed to fetch projects");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.info("Logged out");
    navigate("/login");
  };

  const handleJoinProject = (project) => {
    setCurrentProject(project);
    socket.connect();
    socket.emit("join-room", { projectId: project._id });
    toast.success(`Joined ${project.name}`);
  };

  const sendMessage = () => {
    if (!input.trim() || !currentProject) return;
    socket.emit("send-message", { projectId: currentProject._id, message: input });
    setMessages((prev) => [...prev, { text: input, type: "self" }]);
    setInput("");
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (currentProject) {
      socket.emit("code-change", { projectId: currentProject._id, code: newCode });
    }
  };

  return (
    <div className="flex h-screen bg-[#0d0d1a] text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a1a2e] p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-8">CollabAI</h2>
          <nav className="space-y-4">
            {projects.map((p) => (
              <button
                key={p._id}
                onClick={() => handleJoinProject(p)}
                className={`block w-full text-left rounded px-2 py-1 ${
                  currentProject?._id === p._id
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-[#2a2a40]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Chat Panel */}
        <div className="w-1/3 border-r border-[#2c2c3e] p-4 flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Live Chat</h3>
          <div className="flex-1 overflow-y-auto space-y-2 text-sm">
            {messages.map((msg, i) => (
              <p
                key={i}
                className={`p-2 rounded ${
                  msg.type === "self"
                    ? "bg-blue-500 self-end text-right"
                    : "bg-[#2a2a40]"
                }`}
              >
                {msg.text}
              </p>
            ))}
          </div>
          <div className="mt-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              placeholder="Type a message..."
              className="w-full p-2 rounded bg-[#1a1a2e] border border-[#333] text-white"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 p-4">
          <h3 className="text-lg font-semibold mb-4">Code Editor</h3>
          <textarea
            value={code}
            onChange={handleCodeChange}
            placeholder="Start coding..."
            className="w-full h-full bg-[#1f1f30] text-white p-4 rounded border border-[#333] resize-none"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
