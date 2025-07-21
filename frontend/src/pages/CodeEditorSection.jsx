import React, { useState, useEffect } from "react";
import {
  FaPlay, FaFolder, FaFile, FaPlus, FaMagic, FaTrash,
  FaEdit, FaFileAlt, FaFolderPlus, FaClock
} from "react-icons/fa";
import axios from "axios";
import { motion } from "framer-motion";
import Confetti from "react-confetti"; // npm i react-confetti

// Sparkle animation for new files/folders
const Sparkle = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping absolute top-1/2 left-1/2" />
    <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse absolute top-1/3 left-2/3" />
  </div>
);

export default function CodeEditorSection({
  files,
  setFiles,
  activeFile,
  setActiveFile,
  setCode,
  code,
  handleCodeChange,
  socket,
  currentProjectId,
  output,
  showOutput,
  setShowOutput,
  executionStatus,
  stdin,
  setStdin,
  versionHistory,
  fetchVersionHistory,
  rollbackToVersion,
  typingUser,
  onlineUsers
}) {
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [runningOutput, setRunningOutput] = useState("");
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Auto-remove "NEW" badge after 5 seconds
  useEffect(() => {
    if (files.some(f => f.isNew)) {
      const timer = setTimeout(() => {
        setFiles(prev => prev.map(f => ({ ...f, isNew: false })));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [files, setFiles]);

  // Select a file to edit
  const handleSelectFile = (file) => {
    if (file.type === "file") {
      setActiveFile(file.name);
      setCode(file.content || "");
    }
  };

  // Rename file/folder
  const handleRename = (item) => {
    const newName = prompt("Enter new name:", item.name);
    if (!newName || newName === item.name) return;
    const updated = files.map(f => f.name === item.name ? { ...f, name: newName } : f);
    setFiles(updated);
    socket?.emit("sync-files", { projectId: currentProjectId, files: updated });
  };

  // Create new file or folder
  const handleAddItemToFiles = (type = "file", parent = "") => {
    const baseName = type === "file"
      ? `Untitled-${Date.now()}.js`
      : `NewFolder-${Date.now()}`;
    const name = parent ? `${parent}${baseName}` : baseName;

    const newItem = {
      name,
      type,
      content: type === "file" ? "" : undefined,
      isNew: true
    };

    const updatedFiles = [...files, newItem];
    setFiles(updatedFiles);
    socket?.emit("sync-files", { projectId: currentProjectId, files: updatedFiles });
  };

  // Delete file/folder
  const handleDelete = (item) => {
    const updated = files.filter(f => !f.name.startsWith(item.name));
    setFiles(updated);
    socket?.emit("sync-files", { projectId: currentProjectId, files: updated });
  };

  // Map extension → Judge0 language IDs
  const getLanguageId = (fileName) => {
    const ext = fileName?.split(".").pop();
    const map = { js: 63, py: 71, cpp: 54, c: 50, java: 62, php: 68, rb: 72, go: 60, cs: 51 };
    return map[ext] || 71;
  };

  // Run code (via backend API)
  const handleRunCode = async () => {
    if (!activeFile || !code.trim()) {
      setShowOutput(true);
      setRunningOutput("⚠️ Write some code before running.");
      return;
    }
    const languageId = getLanguageId(activeFile);
    try {
      const res = await axios.post("http://localhost:5000/api/run", { code, languageId, stdin });
      const data = res.data;
      setShowOutput(true);
      setRunningOutput(data.stdout || data.compile_output || data.stderr || "No output");
    } catch {
      setShowOutput(true);
      setRunningOutput("Execution error");
    }
  };

  // Live preview (HTML files)
  const handleOpenLivePreview = async () => {
    const projectName = currentProjectId || "live-preview-temp";
    try {
      let projectFiles = files;
      if (!files.some(f => f.name.toLowerCase().includes("index.html"))) {
        projectFiles = [...files, { name: "index.html", type: "file", content: "<h1>Hello World</h1>", isNew: true }];
        setFiles(projectFiles);
      }
      await axios.post("http://localhost:5000/api/save-project", { projectName, files: projectFiles });
      window.open(`http://localhost:5000/sites/${projectName}/index.html`, "_blank");
    } catch {
      alert("Failed to save and open live preview.");
    }
  };

  // Recursive file explorer
  const renderExplorer = (parent = "") => {
    return files
      .filter(f => f.name.startsWith(parent) && f.name.replace(parent, "").split("/").length === 1)
      .map(item => (
        <motion.li
          key={item.name}
          initial={item.isNew ? { scale: 0.7, opacity: 0 } : {}}
          animate={item.isNew ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: "spring", stiffness: 150, damping: 12 }}
          className="group relative"
        >
          <div
            className={`flex justify-between items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-purple-500/20 ${
              item.isNew ? "shadow-[0_0_15px_#ec4899]" : ""
            } ${activeFile === item.name ? "bg-purple-600/30" : ""}`}
            onClick={() => handleSelectFile(item)}
          >
            <span className="flex items-center gap-2 relative">
              {item.type === "file" ? <FaFileAlt /> : <FaFolder />}
              {item.name.split("/").pop()}
              {item.isNew && (
                <>
                  <span className="ml-2 text-xs text-pink-400 animate-pulse">NEW</span>
                  <Sparkle />
                </>
              )}
            </span>
            <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={(e) => { e.stopPropagation(); handleRename(item); }}>
                <FaEdit className="text-yellow-400 hover:scale-110" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
                <FaTrash className="text-red-400 hover:scale-110" />
              </button>
              {item.type === "folder" && (
                <button onClick={(e) => { e.stopPropagation(); handleAddItemToFiles("file", item.name + "/"); }}>
                  <FaPlus className="text-green-400 hover:scale-110" />
                </button>
              )}
            </span>
          </div>
          {item.type === "folder" && (
            <ul className="ml-4 border-l border-purple-400/30 pl-2">
              {renderExplorer(item.name + "/")}
            </ul>
          )}
        </motion.li>
      ));
  };

  // AI Website generation
  const handleGenerateAIProject = async () => {
    if (!userPrompt.trim()) return alert("Please enter a valid description.");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/generate-website", { userGoal: userPrompt });
      const generated = res.data;
      const newFiles = generated.files.map(file => ({
        name: file.path,
        type: "file",
        content: file.content,
        isNew: true
      }));
      setFiles(newFiles);
      setActiveFile(newFiles[0]?.name || "");
      setCode(newFiles[0]?.content || "");
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 4000);
      socket?.emit("sync-files", { projectId: currentProjectId, files: newFiles });
      setShowPromptModal(false);
      setUserPrompt("");
    } catch {
      alert("Failed to generate website from AI.");
    } finally {
      setLoading(false);
    }
  };

  // Version history
  const handleOpenVersionHistory = async () => {
    await fetchVersionHistory(currentProjectId);
    setShowVersionModal(true);
  };

  return (
    <div className="flex flex-col w-full h-full text-white font-mono bg-gradient-to-br from-[#05010e] via-[#0d0120] to-[#05010e] relative overflow-hidden">
      {confettiActive && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} />}

      {/* Glowing background blobs */}
      <div className="absolute -top-40 left-20 w-[400px] h-[400px] rounded-full bg-purple-700/30 blur-[150px] animate-pulse" />
      <div className="absolute -bottom-40 right-20 w-[400px] h-[400px] rounded-full bg-pink-700/30 blur-[150px] animate-pulse delay-200" />

      {/* Tabs */}
      <div className="flex px-4 py-2 border-b border-purple-500/40 bg-black/40 backdrop-blur-lg text-sm justify-between shadow-[0_0_15px_rgba(147,51,234,0.3)]">
        <div className="flex space-x-2">
          {files.filter(f => f.type === "file").map(f => (
            <div
              key={f.name}
              onClick={() => handleSelectFile(f)}
              className={`px-3 py-1 rounded-t cursor-pointer transition-all ${
                activeFile === f.name
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                  : "hover:bg-purple-600/30 text-gray-300"
              }`}
            >
              {f.name.split("/").pop()}
            </div>
          ))}
        </div>
        <button onClick={handleOpenVersionHistory} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
          <FaClock /> Versions
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Explorer */}
        <div className="w-[240px] bg-black/40 backdrop-blur-xl p-3 border-r border-purple-500/30 shadow-[0_0_10px_rgba(147,51,234,0.3)]">
          <div className="flex justify-between items-center mb-2 text-purple-300">
            <span className="flex items-center gap-2 text-sm font-semibold"><FaFolder /> Explorer</span>
            <div className="flex gap-2">
              <button onClick={() => setShowPromptModal(true)} title="AI" className="hover:scale-110"><FaMagic /></button>
              <button onClick={() => handleAddItemToFiles("file")} className="hover:scale-110"><FaFile /></button>
              <button onClick={() => handleAddItemToFiles("folder")} className="hover:scale-110"><FaFolderPlus /></button>
            </div>
          </div>
          <ul className="text-xs space-y-1 text-gray-300">
            {renderExplorer()}
          </ul>
        </div>

        {/* Code Editor */}
        <div className="flex-1 p-4">
          <div className="flex flex-col bg-black/40 backdrop-blur-lg h-full rounded-xl border border-purple-500/30 shadow-[0_0_25px_rgba(147,51,234,0.3)]">
            <textarea
              value={code}
              onChange={(e) => {
                handleCodeChange(e);
                socket?.emit("typing", { projectId: currentProjectId, userName: "Someone" });
              }}
              onBlur={() => socket?.emit("stop-typing", { projectId: currentProjectId })}
              className="w-full flex-1 p-4 bg-transparent text-white text-sm rounded-t-xl resize-none outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Write your code here..."
            />
            <div className="p-3 flex justify-between items-center border-t border-purple-500/30 text-xs text-gray-400">
              <div>{typingUser ? `${typingUser} is typing...` : `${onlineUsers?.length || 0} users online`}</div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px #22c55e" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRunCode}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                >
                  <FaPlay /> Run
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px #3b82f6" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleOpenLivePreview}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
                >
                  🌐 Live Preview
                </motion.button>
              </div>
            </div>
            {showOutput && (
              <div className="bg-black/70 text-green-400 text-xs font-mono p-3 h-[150px] overflow-y-auto border-t border-purple-500/30">
                {runningOutput || output || "No output yet..."}
                {executionStatus?.description ? `\nStatus: ${executionStatus.description}` : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black/60 backdrop-blur-xl p-6 rounded-xl w-[500px] max-h-[400px] overflow-y-auto border border-purple-500/40 shadow-[0_0_30px_rgba(236,72,153,0.4)]"
          >
            <h2 className="text-lg font-bold mb-4 text-purple-300">Version History</h2>
            {versionHistory.length === 0 ? (
              <p className="text-gray-400">No versions available yet.</p>
            ) : (
              <ul className="space-y-3">
                {versionHistory.map(version => (
                  <li key={version._id} className="flex justify-between items-center text-sm bg-purple-900/30 p-3 rounded-lg">
                    <span>{new Date(version.createdAt).toLocaleString()}</span>
                    <button
                      onClick={() => rollbackToVersion(version._id)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 px-3 py-1 rounded text-white text-xs"
                    >
                      Rollback
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowVersionModal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">Close</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black/60 backdrop-blur-xl p-6 rounded-xl w-[480px] border border-purple-500/40 shadow-[0_0_30px_rgba(236,72,153,0.4)] text-white"
          >
            <h2 className="text-lg font-bold mb-3 text-purple-300">⚡ Generate Website with AI</h2>
            <textarea
              rows={4}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full p-3 rounded bg-transparent border border-purple-500 text-sm font-mono focus:ring-2 focus:ring-pink-400"
              placeholder="Describe the website you want to build..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowPromptModal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">Cancel</button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px #9333ea" }}
                whileTap={{ scale: 0.9 }}
                onClick={handleGenerateAIProject}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center gap-2"
              >
                {loading ? "Generating..." : "Generate"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
