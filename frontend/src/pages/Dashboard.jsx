import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import { toast } from "react-toastify";
import ChatSection from "./ChatSection";
import CodeEditorSection from "./CodeEditorSection";
import api from "../services/api";
import { useUser } from "../context/UserContext";

const languageMap = {
  js: 63,
  py: 71,
  cpp: 54,
  c: 50,
  java: 62,
};

const getLanguageIdFromFile = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  return languageMap[ext] || 71;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");
  const [files, setFiles] = useState([{ name: "App.js", type: "file", content: "" }]);
  const [activeFile, setActiveFile] = useState("App.js");
  const [output, setOutput] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [stdin, setStdin] = useState("");

  const chatRef = useRef();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProjects();
    if (!socket.connected) socket.connect();

    socket.on("connect", () => console.log("✅ Socket connected"));
    socket.on("receive-message", (msg) => {
      console.log("📥 Message received:", msg);
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("receive-code", (newCode) => {
      console.log("📥 Code received:", newCode);
      setCode(newCode);
      updateFileContent(activeFile, newCode);
    });
    socket.on("sync-files", (incomingFiles) => {
      console.log("📥 Files synced:", incomingFiles);
      setFiles(incomingFiles);
    });

    return () => {
      socket.off("receive-message");
      socket.off("receive-code");
      socket.off("sync-files");
      socket.off("connect");
    };
  }, [activeFile]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/project/my-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err) {
      toast.error("Failed to fetch projects");
    }
  };

  const loadChatHistory = async (projectId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      toast.error("Failed to load chat history");
    }
  };

  const handleJoinProject = async (project) => {
    try {
      setCurrentProject(project);
      await loadChatHistory(project._id);

      const res = await axios.get(`http://localhost:5000/api/project/${project._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedCode = res.data.code || "";
      const savedFiles = res.data.files || [];
      setCode(savedCode);
      setFiles(savedFiles);
      updateFileContent(activeFile, savedCode);

      socket.emit("join-room", { projectId: project._id, userId: user._id });
      socket.emit("sync-files", { projectId: project._id, files: savedFiles });

      toast.success(`Joined ${project.name}`);
      setActiveModal(null);
    } catch (err) {
      toast.error("Failed to join project");
    }
  };

const sendMessage = async () => {
  if (!input.trim() || !currentProject) return;

  const userMsg = input;
  setInput("");

  const messageData = {
    projectId: currentProject._id,
    sender: "user",
    senderId: user._id,
    message: userMsg,
    timestamp: new Date(),
  };

  // 👇 Immediately show user message in chat
  setMessages((prev) => [...prev, messageData]);

  // 🔌 Emit to other users
  socket.emit("send-message", messageData);

  // 💾 Save in DB
  try {
    await axios.post("http://localhost:5000/api/chat", messageData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.error("Error saving message:", err);
  }

  // 🤖 AI logic
  if (userMsg.startsWith("@ai")) {
    const prompt = userMsg.replace("@ai", "").trim();
    if (!prompt) return toast.warn("Please write something after @ai");

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        sender: "loading",
        message: "🤖 AI is typing...",
        timestamp: new Date(),
      },
    ]);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/ai/reply",
        { prompt },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const aiMessage = {
        projectId: currentProject._id,
        sender: "ai",
        senderId: "ai-bot",
        message: `🤖 ${res.data.reply}`,
        timestamp: new Date(),
      };

      socket.emit("send-message", aiMessage);

      // 👇 Save AI reply to DB
      await axios.post("http://localhost:5000/api/chat", aiMessage, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 👇 Show AI reply
      setMessages((prev) => [...prev.filter((msg) => msg.sender !== "loading"), aiMessage]);

    } catch (err) {
      toast.error("AI couldn't respond.");
      setMessages((prev) => prev.filter((msg) => msg.sender !== "loading"));
    } finally {
      setIsLoading(false);
    }
  }
};




  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    updateFileContent(activeFile, newCode);

    if (currentProject) {
      socket.emit("code-change", { projectId: currentProject._id, code: newCode });
      socket.emit("sync-files", { projectId: currentProject._id, files });
    }
  };

  const updateFileContent = (fileName, newContent) => {
    setFiles((prev) => prev.map((f) => (f.name === fileName ? { ...f, content: newContent } : f)));
  };

  const handleAddItemToFiles = () => {
    const name = prompt("Enter file or folder name:");
    if (!name) return;

    const isFolder = !name.includes(".");
    if (files.some((f) => f.name === name)) return toast.warn("Already exists");

    const newItem = { name, type: isFolder ? "folder" : "file", content: isFolder ? null : "" };
    const updated = [...files, newItem];
    setFiles(updated);

    if (currentProject) {
      socket.emit("sync-files", { projectId: currentProject._id, files: updated });
    }

    if (!isFolder) {
      setActiveFile(name);
      setCode("");
    }
  };

  const handleRunCode = async () => {
    const languageId = getLanguageIdFromFile(activeFile);
    try {
      const res = await axios.post("http://localhost:5000/api/run", {
        code,
        languageId,
        stdin,
      });
      const data = res.data;
      setOutput(
        data.stdout || data.compile_output || data.stderr || data.message || "No output"
      );
      setExecutionStatus(data.status);
    } catch (err) {
      setOutput("Execution error");
      setExecutionStatus({ description: "Error" });
    }
    setShowOutput(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.info("Logged out");
    navigate("/login");
  };

  const toggleModal = (type) => {
    setActiveModal((prev) => (prev === type ? null : type));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName || !collaboratorEmail) {
      toast.error("All fields required");
      return;
    }
    try {
      await api.post("/project/create", { name: projectName, collaboratorEmail }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Project created");
      fetchProjects();
      setActiveModal(null);
      setProjectName("");
      setCollaboratorEmail("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Project creation failed");
    }
  };

  return (
    <div className="flex h-screen bg-[#111827] text-white font-sans">
      <ChatSection
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        toggleModal={toggleModal}
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        handleLogout={handleLogout}
        projects={projects}
        handleJoinProject={handleJoinProject}
        projectName={projectName}
        setProjectName={setProjectName}
        collaboratorEmail={collaboratorEmail}
        setCollaboratorEmail={setCollaboratorEmail}
        handleCreateProject={handleCreateProject}
        messages={messages}
        chatRef={chatRef}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        isLoading={isLoading}
      />

      <CodeEditorSection
        files={files}
        setFiles={setFiles}
        activeFile={activeFile}
        setActiveFile={setActiveFile}
        setCode={setCode}
        code={code}
        handleCodeChange={handleCodeChange}
        handleRunCode={handleRunCode}
        output={output}
        showOutput={showOutput}
        setShowOutput={setShowOutput}
        socket={socket}
        currentProjectId={currentProject?._id}
        handleAddItemToFiles={handleAddItemToFiles}
        executionStatus={executionStatus}
        stdin={stdin}
        setStdin={setStdin}
      />
    </div>
  );
}
