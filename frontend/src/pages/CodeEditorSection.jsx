import React, { useState, useEffect } from "react";
import { FaPlay, FaFolder, FaFile, FaPlus, FaMagic } from "react-icons/fa";
import axios from "axios";

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
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const [autoRun, setAutoRun] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState([]);

  const generateLivePreviewHTML = () => {
    const htmlFile = files.find((f) => f.name.endsWith(".html"))?.content || "";
    const cssFile = files.find((f) => f.name.endsWith(".css"))?.content || "";
    const jsFile = files.find((f) => f.name.endsWith(".js"))?.content || "";

    const consoleScript = `
      <script>
        const originalLog = console.log;
        console.log = function (...args) {
          originalLog(...args);
          parent.postMessage({ type: 'console-log', data: args }, '*');
        };
      <\/script>
    `;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Live Preview</title>
        <style>${cssFile}</style>
      </head>
      <body>
        ${htmlFile}
        ${consoleScript}
        <script>${jsFile.replace(/<\/script>/g, "<\\/script>")}</script>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    if (!autoRun) return;
    const timeout = setTimeout(() => {
      setPreviewHTML(generateLivePreviewHTML());
      setConsoleLogs([]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [files, code, autoRun]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "console-log") {
        setConsoleLogs((prev) => [...prev, ...event.data.data.map((d) => String(d))]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  const handleGenerateAIProject = async () => {
    if (!userPrompt.trim()) return alert("Please enter a valid description.");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/generate-website", {
        userGoal: userPrompt,
      });

      const generated = res.data;
      const newFiles = generated.files.map((file) => ({
        name: file.path.split("/").pop(),
        type: "file",
        content: file.content,
      }));

      setFiles(newFiles);
      setActiveFile(newFiles[0]?.name || "");
      setCode(newFiles[0]?.content || "");

      if (currentProjectId && socket) {
        socket.emit("sync-files", { projectId: currentProjectId, files: newFiles });
      }

      setShowPromptModal(false);
      setUserPrompt("");
    } catch (err) {
      alert("Failed to generate website from AI.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#111827] text-white">
      {/* Tabs */}
      <div className="flex bg-[#1f2937] px-4 py-2 border-b border-gray-700 space-x-2">
        {files.filter((item) => item.type === "file").map((file) => (
          <div
            key={file.name}
            className={`px-4 py-1 rounded-t text-sm font-mono cursor-pointer ${activeFile === file.name ? "bg-[#374151]" : "bg-[#1a1a2e]"}`}
            onClick={() => handleSelectFile(file)}
          >
            {file.name}
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Explorer */}
        <div className="w-[220px] bg-[#1e293b] p-4 border-r border-gray-700">
          <div className="flex justify-between items-center mb-3 text-sm font-semibold">
            <span className="flex items-center gap-2"><FaFolder /> Explorer</span>
            <div className="flex gap-2">
              <button onClick={() => setShowPromptModal(true)} title="AI Generate" className="text-purple-400 hover:text-purple-300"><FaMagic /></button>
              <button onClick={handleAddItemToFiles} title="Add" className="text-green-400 hover:text-green-300"><FaPlus /></button>
            </div>
          </div>
          <ul className="space-y-2 text-xs">
            {files.map((item) => (
              <li
                key={item.name}
                className={`flex items-center gap-2 cursor-pointer hover:text-indigo-400 ${item.type === "file" ? "" : "text-yellow-400"}`}
                onClick={() => item.type === "file" && handleSelectFile(item)}
              >
                {item.type === "file" ? <FaFile /> : <FaFolder />}
                {item.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Editor + Live Preview */}
        <div className="flex-1 grid grid-cols-2 gap-4 p-4 bg-[#0f172a] overflow-auto">
          <div className="flex flex-col bg-[#1f2937] rounded-lg shadow-lg border border-gray-700">
            <textarea
              value={code}
              onChange={handleCodeChange}
              placeholder="Start coding..."
              className="w-full h-[300px] p-4 rounded-t bg-[#0f172a] text-white font-mono text-sm border-b border-gray-700 resize-none"
            />
            <div className="p-3 flex justify-between items-center">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={autoRun} onChange={() => setAutoRun(!autoRun)} className="accent-green-500" />
                Live Mode
              </label>
              <button
                onClick={() => {
                  handleRunCode();
                  setShowOutput(true);
                }}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 text-sm rounded-lg flex items-center gap-2 shadow"
              >
                <FaPlay /> Run
              </button>
            </div>
          </div>

          <div className="flex flex-col rounded-lg overflow-hidden border border-gray-700 shadow-lg bg-white">
            <iframe
              title="Live Preview"
              srcDoc={previewHTML}
              sandbox="allow-scripts"
              frameBorder="0"
              className="w-full h-[350px]"
            ></iframe>
            <div className="bg-black text-green-400 text-xs font-mono p-2 h-[100px] overflow-y-auto">
              {consoleLogs.length > 0 ? consoleLogs.map((log, index) => <div key={index}>{log}</div>) : (
                <span className="text-gray-500">console.log output will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showOutput && (
        <div className="w-full bg-[#0f172a] border-t border-gray-700 max-h-64 overflow-y-auto shadow-inner z-50">
          <div className="flex justify-between items-center px-4 py-2 bg-[#1e1e2f] border-b border-gray-600">
            <h4 className="text-sm font-semibold">Terminal</h4>
            <span className={`text-xs px-2 py-1 rounded ${executionStatus?.description === "Accepted" ? "bg-green-700 text-green-300" : "bg-red-700 text-red-300"}`}>
              {executionStatus?.description || "Running..."}
            </span>
            <button onClick={() => setShowOutput(false)} className="text-red-400 hover:text-red-500">✕</button>
          </div>
          <pre className="px-4 py-3 text-sm font-mono text-green-300 whitespace-pre-wrap">
            {output || "Waiting for output..."}
          </pre>
        </div>
      )}

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
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAIProject}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 flex items-center gap-2"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}