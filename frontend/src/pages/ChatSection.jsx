import React from "react";
import { toast } from "react-toastify";
import { FaBars } from "react-icons/fa";
import { useUser } from "../context/UserContext";

export default function ChatSection({
  menuOpen,
  setMenuOpen,
  toggleModal,
  activeModal,
  setActiveModal,
  handleLogout,
  projects,
  handleJoinProject,
  projectName,
  setProjectName,
  collaboratorEmail,
  setCollaboratorEmail,
  handleCreateProject,
  messages,
  chatRef,
  input,
  setInput,
  sendMessage,
  isLoading,
}) {
  const { user } = useUser();

  // Helper: Deduplicate users by _id
  const getUniqueUsers = (users) => {
    const map = new Map();
    users.forEach((u) => {
      if (u && u._id) {
        map.set(u._id, u);
      }
    });
    return Array.from(map.values());
  };

  return (
    <div className="w-1/4 bg-[#1a1a2e] flex flex-col border-r border-[#2c2c3e]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2c2c3e]">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          <FaBars className="text-xl" />
        </button>
        <h2 className="text-lg font-bold">CollabAI</h2>
      </div>

      {/* Menu */}
      {menuOpen && (
        <div className="p-4 space-y-2 text-sm border-b border-[#333] bg-[#1f2937]">
          <button onClick={() => toggleModal("addCollaborator")} className="block w-full text-left hover:text-indigo-400">Add Collaborators</button>
          <button onClick={() => toggleModal("newProject")} className="block w-full text-left hover:text-indigo-400">New Project</button>
          <button onClick={() => toggleModal("projects")} className="block w-full text-left hover:text-indigo-400">My Projects</button>
          <button onClick={handleLogout} className="block w-full text-left text-red-400 hover:text-red-600">Logout</button>
        </div>
      )}

      {/* Modal Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {/* Projects Modal */}
        {activeModal === "projects" && (
          <div className="bg-[#1f2937] p-4 rounded-lg border border-[#333]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">My Projects</h2>
              <button onClick={() => setActiveModal(null)} className="text-red-400">✕</button>
            </div>
            {projects.length === 0 ? (
              <p className="text-gray-400">No projects found.</p>
            ) : (
              <ul className="space-y-3">
                {projects.map((project) => (
                  <li key={project._id} className="bg-[#121222] p-3 rounded border border-[#444]">
                    <p className="text-indigo-400 font-semibold">{project.name}</p>
                    <ul className="ml-4 mt-1 list-disc text-gray-400 text-sm">
                      {getUniqueUsers(project.users).map((u) => (
                        <li key={u._id}>{u.name} ({u.email})</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleJoinProject(project)}
                      className="mt-2 text-xs text-green-400 hover:text-green-300"
                    >
                      Join this project
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        {activeModal === "newProject" && (
          <div className="bg-[#1f2937] p-4 rounded-lg border border-[#333]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Create New Project</h2>
              <button onClick={() => setActiveModal(null)} className="text-red-400">✕</button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <input
                type="text"
                placeholder="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-3 rounded bg-[#0f172a] border border-[#444] text-white"
              />
              <input
                type="email"
                placeholder="Collaborator Email"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                className="w-full p-3 rounded bg-[#0f172a] border border-[#444] text-white"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 w-full py-2 rounded"
              >
                Create Project
              </button>
            </form>
          </div>
        )}

        {/* Add Collaborator Modal */}
        {activeModal === "addCollaborator" && (
          <div className="bg-[#1f2937] p-4 rounded-lg border border-[#333]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Add Collaborator</h2>
              <button onClick={() => setActiveModal(null)} className="text-red-400">✕</button>
            </div>
            <p className="text-gray-400">Feature coming soon...</p>
          </div>
        )}

        {/* Chat Messages */}
        <div className="space-y-2 mt-4 overflow-y-auto max-h-80" ref={chatRef}>
          {messages.map((msg, i) => {
            const isSelf = msg.sender === "user" && msg.senderId === user?._id;

            return (
              <div
                key={`${msg?.sender}-${msg?.timestamp}-${i}`}
                className={`flex mb-2 ${isSelf ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[70%] text-sm ${
                    msg.sender === "ai"
                      ? "bg-[#37376e] text-green-300"
                      : msg.sender === "loading"
                      ? "bg-gray-700 text-gray-300 italic"
                      : isSelf
                      ? "bg-blue-500 text-white"
                      : "bg-[#2a2a40] text-white"
                  }`}
                >
                  {msg.message || msg.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-[#333]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 rounded bg-[#1f2937] border border-[#333] text-white"
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
