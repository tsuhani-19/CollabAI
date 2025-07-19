// Dashboard.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import { toast } from "react-toastify";
import ChatSection from "./ChatSection";
import CodeEditorSection from "./CodeEditorSection";
import api from "../services/api";
import { useUser } from "../context/UserContext";

const languageMap = { js: 63, py: 71, cpp: 54, c: 50, java: 62 };

const getLanguageIdFromFile = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  return languageMap[ext] || 71;
};

// To avoid duplicate messages
const receivedMessages = new Set();

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const token = localStorage.getItem("token");

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
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  const chatRef = useRef();

  const handleAxiosError = (err) => {
    toast.error(err?.response?.data?.message || "Something went wrong");
  };

  // Format timestamp to show HH:MM AM/PM
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    fetchProjects();

    const handleReceiveMessage = (msg) => {
      const uniqueKey = `${msg.senderId || "unknown"}-${msg.message}-${msg.timestamp}`;

      // Skip duplicates
      if (receivedMessages.has(uniqueKey)) return;

      // Skip our own messages (already displayed locally)
      if (String(msg.senderId) === String(user?.id)) return;

      receivedMessages.add(uniqueKey);

      // Attach formatted time
      msg.formattedTime = formatTime(msg.timestamp);

      setMessages((prev) => [...prev, msg]);
    };

    const handleReceiveCode = (newCode) => {
      setCode(newCode);
      updateFileContent(activeFile, newCode);
    };

    const handleSyncFiles = (incomingFiles) => {
      setFiles(incomingFiles);
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("receive-code", handleReceiveCode);
    socket.on("sync-files", handleSyncFiles);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("receive-code", handleReceiveCode);
      socket.off("sync-files", handleSyncFiles);
    };
  }, [activeFile, user?.id]);

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
      handleAxiosError(err);
    }
  };

  const loadChatHistory = async (projectId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Add formatted time for all messages
      const msgs = res.data.map((m) => ({
        ...m,
        formattedTime: formatTime(m.timestamp),
      }));
      setMessages(msgs);
    } catch (err) {
      handleAxiosError(err);
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
      setActiveFile(savedFiles[0]?.name || "App.js");

      const connectAndJoin = () => {
        socket.emit("join-room", {
          projectId: project._id,
          userId: user.id,
        });
        setHasJoinedRoom(true);
        socket.emit("sync-files", { projectId: project._id, files: savedFiles });
      };

      if (!socket.connected) {
        socket.connect();
        socket.once("connect", () => connectAndJoin());
      } else {
        connectAndJoin();
      }

      toast.success(`Joined ${project.name}`);
      setActiveModal(null);
    } catch (err) {
      handleAxiosError(err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentProject || !currentProject._id || !user?.id) {
      return toast.error("Please join a project and write a message.");
    }

    const userMsg = input.trim();
    setInput("");

    const timestamp = new Date();
    const messageData = {
      projectId: currentProject._id,
      sender: "user",
      senderId: user.id,
      senderName: user.name,
      message: userMsg,
      timestamp,
      formattedTime: formatTime(timestamp), // Add time for UI
    };

    const uniqueKey = `${messageData.senderId}-${messageData.message}-${messageData.timestamp}`;
    receivedMessages.add(uniqueKey);

    // Show locally
    setMessages((prev) => [...prev, messageData]);

    // Broadcast to others
    socket.emit("send-message", messageData);

    try {
      await axios.post("http://localhost:5000/api/chat", messageData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      toast.error("Message not saved.");
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
      setOutput(data.stdout || data.compile_output || data.stderr || "No output");
      setExecutionStatus(data.status);
    } catch {
      setOutput("Execution error");
      setExecutionStatus({ description: "Error" });
    }
    setShowOutput(true);
  };

  const handleLogout = () => {
    if (socket.connected) socket.disconnect();
    localStorage.removeItem("token");
    toast.info("Logged out");
    navigate("/login");
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName || !collaboratorEmail) {
      return toast.error("All fields required");
    }

    try {
      await api.post(
        "/project/create",
        { name: projectName, collaboratorEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Project created");
      fetchProjects();
      setProjectName("");
      setCollaboratorEmail("");
      setActiveModal(null);
    } catch (err) {
      handleAxiosError(err);
    }
  };

  const handleAddCollaborator = async (projectId, email) => {
    if (!email) return toast.error("Email required");

    try {
      await api.post(
        "/project/add-collaborator",
        { projectId, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Collaborator added");
      fetchProjects();
    } catch (err) {
      handleAxiosError(err);
    }
  };

  return (
    <div className="flex h-screen bg-[#111827] text-white font-sans">
      <ChatSection
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
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
        handleAddCollaborator={handleAddCollaborator}
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
