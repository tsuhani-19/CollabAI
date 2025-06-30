import React from "react";
import { FaPlay, FaFolder, FaFile, FaPlus } from "react-icons/fa";

export default function CodeEditorSection({
  files,
  setFiles,
  activeFile,
  setActiveFile,
  setCode,
  code,
  handleCodeChange,
  handleRunCode,
  output,
  showOutput,
  setShowOutput,
  socket,
  currentProjectId,
  executionStatus,
}) {
  const handleSelectFile = (file) => {
    setActiveFile(file.name);
    setCode(file.content || "");
  };

  const handleAddItemToFiles = () => {
    const name = prompt("Enter file or folder name (e.g. App.js or utils):");
    if (!name) return;

    const isFolder = !name.includes(".");
    const exists = files.some((item) => item.name === name);
    if (exists) return alert("Item already exists");

    const newItem = {
      name,
      type: isFolder ? "folder" : "file",
      content: isFolder ? null : "",
    };

    const updatedFiles = [...files, newItem];
    setFiles(updatedFiles);

    if (currentProjectId && socket) {
      socket.emit("sync-files", { projectId: currentProjectId, files: updatedFiles });
    }

    if (newItem.type === "file") {
      setActiveFile(name);
      setCode("");
    }
  };

  return (
    <div className="w-3/4 flex flex-col relative">
      {/* File Tabs */}
      <div className="flex items-center bg-[#1a1a2e] p-2 space-x-2 border-b border-[#2c2c3e]">
        {files
          .filter((item) => item.type === "file")
          .map((file) => (
            <div
              key={file.name}
              className={`px-4 py-1 rounded-t cursor-pointer ${
                activeFile === file.name ? "bg-[#2a2a40]" : "bg-[#121222]"
              }`}
              onClick={() => handleSelectFile(file)}
            >
              {file.name}
            </div>
          ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div className="w-1/5 bg-[#121222] p-4 border-r border-[#2c2c3e]">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              <FaFolder /> Explorer
            </h4>
            <button
              onClick={handleAddItemToFiles}
              className="text-green-400 hover:text-green-300 text-sm"
              title="Add File/Folder"
            >
              <FaPlus />
            </button>
          </div>

          <ul className="space-y-1 text-sm">
            {files.map((item) => (
              <li
                key={item.name}
                className={`flex items-center gap-2 cursor-pointer hover:text-indigo-400 ${
                  item.type === "file" ? "" : "text-yellow-400"
                }`}
                onClick={() =>
                  item.type === "file" ? handleSelectFile(item) : null
                }
              >
                {item.type === "file" ? <FaFile /> : <FaFolder />}
                {item.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Code Editor */}
        <div className="flex-1 p-4 flex flex-col bg-[#1f2937] rounded-lg m-4 shadow-lg">
          <textarea
            value={code}
            onChange={handleCodeChange}
            placeholder="Start coding..."
            className="w-full flex-1 bg-[#0f172a] text-white p-4 rounded border border-[#333] resize-none font-mono text-sm"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                handleRunCode();
                setShowOutput(true);
              }}
              className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl flex items-center gap-2 shadow text-white"
            >
              <FaPlay /> Run
            </button>
          </div>
        </div>
      </div>

      {/* VSCode-like Terminal Output */}
      {showOutput && (
        <div className="absolute bottom-0 left-0 w-full bg-[#0f172a] text-white border-t border-[#333] max-h-64 overflow-y-auto shadow-inner z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#222] bg-[#1e1e2f]">
            <h4 className="text-sm font-semibold">Terminal</h4>
            <span
              className={`text-xs px-2 py-1 rounded ${
                executionStatus?.description === "Accepted"
                  ? "bg-green-700 text-green-300"
                  : "bg-red-700 text-red-300"
              }`}
            >
              {executionStatus?.description || "Running..."}
            </span>
            <button
              onClick={() => setShowOutput(false)}
              className="text-red-400 hover:text-red-500 text-sm"
            >
              ✕
            </button>
          </div>
          <pre className="px-4 py-3 text-sm font-mono whitespace-pre-wrap text-green-300">
            {output || "Waiting for output..."}
          </pre>
        </div>
      )}
    </div>
  );
}
