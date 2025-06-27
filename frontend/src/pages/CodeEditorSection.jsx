import React, { useState } from "react";
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
}) {
  const [explorerItems, setExplorerItems] = useState(files); // [{ name, type: 'file'|'folder', content? }]

  const handleAddItem = () => {
    const name = prompt("Enter name (e.g., App.js or utils):");
    if (!name) return;

    const isFolder = !name.includes(".");

    const exists = explorerItems.some((item) => item.name === name);
    if (exists) return alert("Item already exists");

    const newItem = {
      name,
      type: isFolder ? "folder" : "file",
      content: isFolder ? null : "",
    };

    const updatedItems = [...explorerItems, newItem];
    setExplorerItems(updatedItems);
    setFiles(updatedItems);

    if (newItem.type === "file") {
      setActiveFile(name);
      setCode("");
    }
  };

  const handleSelectFile = (file) => {
    setActiveFile(file.name);
    setCode(file.content);
  };

  return (
    <div className="w-3/4 flex flex-col relative">
      {/* File Tabs */}
      <div className="flex items-center bg-[#1a1a2e] p-2 space-x-2 border-b border-[#2c2c3e]">
        {explorerItems
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
        {/* Explorer Sidebar */}
        <div className="w-1/5 bg-[#121222] p-4 border-r border-[#2c2c3e]">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              <FaFolder /> Explorer
            </h4>
            <button
              onClick={handleAddItem}
              className="text-green-400 hover:text-green-300 text-sm"
              title="Add File/Folder"
            >
              <FaPlus />
            </button>
          </div>

          <ul className="space-y-1 text-sm">
            {explorerItems.map((item) => (
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
            className="w-full flex-1 bg-[#0f172a] text-white p-4 rounded border border-[#333] resize-none"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleRunCode}
              className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-xl flex items-center gap-2 shadow"
            >
              <FaPlay /> Run
            </button>
          </div>
        </div>
      </div>

      {/* Output */}
      {showOutput && (
        <div className="absolute bottom-10 right-10 bg-[#1a1a2e] text-white border border-[#444] p-4 rounded-xl shadow-lg z-50 w-80">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-semibold">Output</h4>
            <button
              onClick={() => setShowOutput(false)}
              className="text-sm text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}
