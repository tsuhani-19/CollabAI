import React, { useEffect, useState } from "react";
import { FaBars, FaPlus, FaCircle } from "react-icons/fa";
import { motion } from "framer-motion";
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
  socket,
  onlineUsers = [],
  typingUser = "",
  markMessagesRead,
}) {
  const { user } = useUser();
  const [unread, setUnread] = useState({});

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const ids = messages.map((m) => m._id).filter(Boolean);
    if (ids.length) markMessagesRead && markMessagesRead(ids);
  }, [messages, markMessagesRead]);

  const getUniqueUsers = (users) => {
    const map = new Map();
    users?.forEach((u) => {
      if (u && u._id) map.set(u._id, u);
    });
    return Array.from(map.values());
  };

  const handleAddCollabPrompt = async (projectId) => {
    const email = prompt("Enter collaborator's email:");
    if (email && projectId) await handleAddCollaborator(projectId, email);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (socket && user) {
      socket.emit("user-typing", {
        projectId: null,
        userName: user?.name || "User",
      });
    }
  };

  return (
    <div className="w-1/4 flex flex-col text-white relative bg-gradient-to-br from-[#05010e] via-[#0d0120] to-[#05010e] border-r border-purple-500/30 shadow-[0_0_25px_rgba(147,51,234,0.3)]">
      {/* Animated glowing blobs in the background */}
      <div className="absolute -top-32 left-10 w-72 h-72 rounded-full bg-purple-600/30 blur-[100px] animate-pulse" />
      <div className="absolute bottom-0 -right-32 w-72 h-72 rounded-full bg-pink-600/30 blur-[100px] animate-pulse delay-300" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/40 backdrop-blur-xl relative z-10">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          <FaBars className="text-xl hover:scale-125 transition-transform duration-300 text-purple-300 drop-shadow-[0_0_8px_#9333ea]" />
        </button>
        <h2 className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text drop-shadow-[0_0_10px_#9333ea]">
          CollabAI
        </h2>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="flex gap-2 items-center px-4 py-2 border-b border-purple-500/20 text-xs text-green-400 bg-black/20 backdrop-blur-md z-10">
          <FaCircle className="text-green-400 text-[8px] animate-pulse" />
          {onlineUsers.length} online
        </div>
      )}

      {/* Slide Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="p-4 space-y-2 text-sm bg-black/40 backdrop-blur-xl border-b border-purple-500/20 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
        >
          <button
            onClick={() => setActiveModal("newProject")}
            className="block w-full text-left text-purple-300 hover:text-pink-400 transition"
          >
            + New Project
          </button>
          <button
            onClick={() => setActiveModal("projects")}
            className="block w-full text-left text-purple-300 hover:text-pink-400 transition"
          >
            My Projects
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left text-red-400 hover:text-red-600 transition"
          >
            Logout
          </button>
        </motion.div>
      )}

      {/* Body */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 relative z-10">
        {/* My Projects Modal */}
        {activeModal === "projects" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/40 backdrop-blur-2xl p-4 rounded-xl border border-purple-500/30 shadow-[0_0_25px_rgba(147,51,234,0.3)]"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">My Projects</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-red-400 hover:text-red-600"
              >
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
                    className="p-3 rounded-lg bg-black/30 border border-purple-500/30 hover:shadow-[0_0_20px_#a855f7] transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-purple-300 font-semibold truncate">
                        {project.name}
                      </p>
                      <button
                        onClick={() => handleAddCollabPrompt(project._id)}
                        className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                      >
                        <FaPlus /> Add
                      </button>
                    </div>
                    <ul className="ml-4 mt-1 list-disc text-gray-400 text-xs">
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
          </motion.div>
        )}

        {/* New Project Modal */}
        {activeModal === "newProject" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/40 backdrop-blur-2xl p-4 rounded-xl border border-purple-500/30 shadow-[0_0_25px_rgba(147,51,234,0.3)]"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Create Project</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <input
                type="text"
                placeholder="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-3 rounded bg-transparent border border-purple-400 text-white focus:ring-2 focus:ring-pink-400"
              />
              <input
                type="email"
                placeholder="Collaborator Email (optional)"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                className="w-full p-3 rounded bg-transparent border border-purple-400 text-white focus:ring-2 focus:ring-pink-400"
              />
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px #9333ea" }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 w-full py-2 rounded shadow-lg transition"
              >
                Create Project
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Chat Messages */}
        <div
          ref={chatRef}
          className="flex flex-col gap-3 px-2 py-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent"
        >
          {messages.map((msg, index) => {
            const isSelf = String(msg.senderId) === String(user?.id);
            const isAI = msg.sender === "ai";
            const showName = !isSelf && !isAI;

            return (
              <motion.div
                key={`${msg._id || index}-${msg.timestamp}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex w-full ${isSelf ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[75%]">
                  {showName && (
                    <p className="text-xs text-gray-400 mb-1">
                      {msg.senderName || "User"}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm shadow-md whitespace-pre-wrap relative ${
                      isAI
                        ? "bg-purple-900/60 text-green-300 border border-green-400/40"
                        : isSelf
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)]"
                        : "bg-gray-800/70 text-white border border-purple-400/20"
                    }`}
                  >
                    {msg.message}
                    <span className="block text-[10px] text-gray-300 mt-1 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {msg.readBy?.length > 0 &&
                        ` • Read by ${msg.readBy.length}`}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Typing Indicator */}
        {typingUser && (
          <div className="px-3 text-xs text-purple-300 italic animate-pulse">
            {typingUser} is typing...
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-purple-500/30 bg-black/40 backdrop-blur-xl">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 rounded bg-transparent border border-purple-400 text-white focus:ring-2 focus:ring-pink-400"
          />
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px #9333ea" }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={isLoading}
            className="px-4 py-2 rounded text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
          >
            {isLoading ? "..." : "Send"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
