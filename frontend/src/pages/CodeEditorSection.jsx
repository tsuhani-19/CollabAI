import React, { useState } from "react";
import {
  FaPlay, FaFolder, FaFile, FaPlus, FaMagic, FaTrash,
  FaEdit, FaFileAlt, FaFolderPlus, FaTerminal
} from "react-icons/fa";
import axios from "axios";

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
}) {
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [output, setOutput] = useState("");

  const handleSelectFile = (file) => {
    if (file.type === "file") {
      setActiveFile(file.name);
      setCode(file.content || "");
    }
  };

  const handleAddFileOrFolder = (isFolder = false, parent = null) => {
    const name = prompt(`Enter ${isFolder ? "folder" : "file"} name:`);
    if (!name) return;
    const fullName = parent ? `${parent}/${name}` : name;
    const exists = files.some((f) => f.name === fullName);
    if (exists) return alert("Item already exists");

    const newItem = {
      name: fullName,
      type: isFolder ? "folder" : "file",
      content: isFolder ? null : "",
    };

    const updated = [...files, newItem];
    setFiles(updated);
    if (socket && currentProjectId)
      socket.emit("sync-files", { projectId: currentProjectId, files: updated });
  };

  const handleRename = (item) => {
    const newName = prompt("Enter new name:", item.name);
    if (!newName || newName === item.name) return;
    const updatedFiles = files.map((f) =>
      f.name === item.name ? { ...f, name: newName } : f
    );
    setFiles(updatedFiles);
    if (socket && currentProjectId)
      socket.emit("sync-files", { projectId: currentProjectId, files: updatedFiles });
  };

  const handleDelete = (item) => {
    const updated = files.filter((f) => !f.name.startsWith(item.name));
    setFiles(updated);
    if (socket && currentProjectId)
      socket.emit("sync-files", { projectId: currentProjectId, files: updated });
  };

  const getLanguageId = (fileName) => {
    if (!fileName) return 71;
    const ext = fileName.split(".").pop();
    const map = {
      js: 63,
      py: 71,
      cpp: 54,
      c: 50,
      java: 62,
      php: 68,
      rb: 72,
      go: 60,
      cs: 51,
    };
    return map[ext] || 71;
  };

  const handleRunCode = async () => {
    const languageId = getLanguageId(activeFile);
    try {
      const res = await axios.post("http://localhost:5000/api/run", {
        code,
        languageId,
        stdin: "",
      });

      const { stdout, stderr, compile_output, message } = res.data;
      const finalOutput = stdout || compile_output || stderr || message || "No output";
      setOutput(finalOutput);
      setShowTerminal(true);
    } catch (err) {
      setOutput("❌ Code run failed: " + (err.response?.data?.error || err.message));
      setShowTerminal(true);
    }
  };

  const renderExplorer = (parent = "") => {
    return files
      .filter((f) => f.name.startsWith(parent) && f.name.replace(parent, "").split("/").length === 1)
      .map((item) => (
        <li key={item.name} className="group">
          <div
            className={`flex justify-between items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-[#2c2f4a] ${activeFile === item.name ? "bg-[#374151]" : ""}`}
            onClick={() => handleSelectFile(item)}
          >
            <span className="flex items-center gap-2">
              {item.type === "file" ? <FaFileAlt /> : <FaFolder />}
              {item.name.split("/").pop()}
            </span>
            <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={(e) => { e.stopPropagation(); handleRename(item); }}><FaEdit className="text-yellow-400" /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }}><FaTrash className="text-red-400" /></button>
              {item.type === "folder" && (
                <button onClick={(e) => { e.stopPropagation(); handleAddFileOrFolder(false, item.name); }}><FaPlus className="text-green-400" /></button>
              )}
            </span>
          </div>
          {item.type === "folder" && (
            <ul className="ml-4 border-l border-gray-600 pl-2">
              {renderExplorer(item.name + "/")}
            </ul>
          )}
        </li>
      ));
  };

  const handleGenerateAIProject = async () => {
    if (!userPrompt.trim()) return alert("Please enter a valid description.");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/generate-website", { userGoal: userPrompt });
      const generated = res.data;
      const newFiles = generated.files.map((file) => ({
        name: file.path,
        type: "file",
        content: file.content,
      }));
      setFiles(newFiles);
      setActiveFile(newFiles[0]?.name || "");
      setCode(newFiles[0]?.content || "");
      if (currentProjectId && socket)
        socket.emit("sync-files", { projectId: currentProjectId, files: newFiles });
      setShowPromptModal(false);
      setUserPrompt("");
    } catch (err) {
      alert("Failed to generate website from AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLivePreview = async () => {
    const projectName = currentProjectId || "my-live-preview";
    try {
      await axios.post("http://localhost:5000/api/save-project", { projectName, files });
      window.open(`http://localhost:5000/sites/${projectName}/index.html`, "_blank");
    } catch (err) {
      alert("Failed to save and open live preview.");
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-br from-[#111827] via-black to-[#0f172a] text-white font-mono">
      {/* Explorer Tabs */}
      <div className="flex bg-[#1f2937] px-4 py-2 border-b border-gray-700 space-x-2 text-sm">
        {files.filter(f => f.type === "file").map(f => (
          <div
            key={f.name}
            onClick={() => handleSelectFile(f)}
            className={`px-3 py-1 rounded-t cursor-pointer ${activeFile === f.name ? "bg-[#374151]" : "hover:bg-[#2c2f4a]"}`}
          >{f.name.split("/").pop()}</div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div className="w-[240px] bg-[#1e293b] p-3 border-r border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="flex items-center gap-2 text-sm font-semibold"><FaFolder /> Explorer</span>
            <div className="flex gap-2">
              <button onClick={() => setShowPromptModal(true)} title="AI" className="text-purple-400"><FaMagic /></button>
              <button onClick={() => handleAddFileOrFolder(false)} className="text-green-400"><FaFile /></button>
              <button onClick={() => handleAddFileOrFolder(true)} className="text-yellow-400"><FaFolderPlus /></button>
            </div>
          </div>
          <ul className="text-xs space-y-1">
            {renderExplorer()}
          </ul>
        </div>

        {/* Code Editor */}
        <div className="flex-1 p-4 bg-[#0f172a] overflow-auto">
          <div className="flex flex-col bg-[#1f2937] h-full rounded-xl shadow-xl border border-gray-700">
            <textarea
              value={code}
              onChange={handleCodeChange}
              className="w-full flex-1 p-4 bg-[#0f172a] text-white text-sm rounded-t-xl resize-none outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your code here..."
            />
            <div className="p-3 flex justify-between items-center border-t border-gray-700">
              <div className="text-xs text-gray-400 cursor-pointer flex items-center gap-2" onClick={() => setShowTerminal(!showTerminal)}>
                <FaTerminal /> Terminal
              </div>
              <div className="flex gap-2">
                <button onClick={handleRunCode} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <FaPlay /> Run
                </button>
                <button onClick={handleOpenLivePreview} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">
                  🌐 Live Preview
                </button>
              </div>
            </div>
            {showTerminal && (
              <div className="bg-black text-green-400 text-xs font-mono p-3 h-[150px] overflow-y-auto border-t border-gray-700">
                {output || "No output yet..."}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
          <div className="bg-[#1f2937] p-6 rounded-xl w-[480px] shadow-xl border border-gray-700 text-white">
            <h2 className="text-lg font-bold mb-3">⚡ Generate Website with AI</h2>
            <textarea
              rows={4}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full p-3 rounded bg-[#0f172a] border border-gray-600 text-sm font-mono"
              placeholder="Describe the website you want to build..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowPromptModal(false)} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700">Cancel</button>
              <button onClick={handleGenerateAIProject} disabled={loading} className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 flex items-center gap-2">
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
