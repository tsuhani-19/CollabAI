import React, { useEffect } from "react";
import { FaBars, FaPlus } from "react-icons/fa";
import { useUser } from "../context/UserContext";

export default function ChatSection({
  menuOpen,
  setMenuOpen,
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
  handleAddCollaborator,
  messages,
  chatRef,
  input,
  setInput,
  sendMessage,
  isLoading,
}) {
  const { user } = useUser();

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const getUniqueUsers = (users) => {
    const map = new Map();
    users?.forEach((u) => {
      if (u && u._id) map.set(u._id, u);
    });
    return Array.from(map.values());
  };

  const handleAddCollabPrompt = async (projectId) => {
    const email = prompt("Enter collaborator's email:");
    if (email && projectId) {
      await handleAddCollaborator(projectId, email);
    }
  };

  return (
    <div className="w-1/4 bg-[#1a1a2e] flex flex-col border-r border-[#2c2c3e] text-white">
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
          <button
            onClick={() => setActiveModal("newProject")}
            className="block w-full text-left hover:text-indigo-400"
          >
            New Project
          </button>
          <button
            onClick={() => setActiveModal("projects")}
            className="block w-full text-left hover:text-indigo-400"
          >
            My Projects
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left text-red-400 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      )}

      {/* Modals */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {activeModal === "projects" && (
          <div className="bg-[#1f2937] p-4 rounded-lg border border-[#333]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">My Projects</h2>
              <button onClick={() => setActiveModal(null)} className="text-red-400">
                ✕
              </button>
            </div>
            {projects.length === 0 ? (
              <p className="text-gray-400">No projects found.</p>
            ) : (
              <ul className="space-y-3">
                {projects.map((project) => (
                  <li
                    key={project._id}
                    className="bg-[#121222] p-3 rounded border border-[#444]"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-indigo-400 font-semibold truncate">
                        {project.name}
                      </p>
                      <button
                        onClick={() => handleAddCollabPrompt(project._id)}
                        className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                      >
                        <FaPlus /> Add
                      </button>
                    </div>
                    <ul className="ml-4 mt-1 list-disc text-gray-400 text-sm">
                      {getUniqueUsers(project.users).map((u) => (
                        <li key={u._id}>
                          {u.name} ({u.email})
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleJoinProject(project)}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                      Join this project
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Create Project */}
        {activeModal === "newProject" && (
          <div className="bg-[#1f2937] p-4 rounded-lg border border-[#333]">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Create New Project</h2>
              <button onClick={() => setActiveModal(null)} className="text-red-400">
                ✕
              </button>
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
                placeholder="Collaborator Email (optional)"
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

        {/* Chat Messages */}
        <div
          ref={chatRef}
          className="flex flex-col gap-3 px-2 py-2 max-h-[400px] overflow-y-auto pr-2 rounded scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          {messages.map((msg, index) => {
            const isSelf = String(msg.senderId) === String(user?.id);
            const isAI = msg.sender === "ai";
            const showName = !isSelf && !isAI;

            return (
              <div
                key={`${msg.senderId || index}-${msg.timestamp}-${index}`}
                className={`flex w-full ${isSelf ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[75%]">
                  {showName && (
                    <p className="text-xs text-gray-400 mb-1">
                      {msg.senderName || "User"}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm shadow-md break-words whitespace-pre-wrap ${
                      isAI
                        ? "bg-purple-800 text-green-300"
                        : isSelf
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#333] bg-[#1a1a2e]">
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
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-sm"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
} 