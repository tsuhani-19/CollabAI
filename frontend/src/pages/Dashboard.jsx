import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket";
import { toast } from "react-toastify";
import ChatSection from "./ChatSection";
import CodeEditorSection from "./CodeEditorSection";
import api from "../services/api";
import { useUser } from "../context/UserContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [activeFile, setActiveFile] = useState("App.js");
  const [output, setOutput] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([
  { name: "App.js", type: "file", content: "" },
]);


  const chatRef = useRef();

  useEffect(() => {
    fetchProjects();

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleReceiveCode = (newCode) => {
      setCode(newCode);
      updateFileContent(activeFile, newCode);
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("receive-code", handleReceiveCode);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("receive-code", handleReceiveCode);
    };
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
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
      const res = await axios.get(`http://localhost:5000/api/chat/${projectId}`);
      setMessages(res.data);
    } catch (err) {
      toast.error("Failed to load chat history");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.info("Logged out");
    navigate("/login");
  };

  const handleJoinProject = async (project) => {
    setCurrentProject(project);
    await loadChatHistory(project._id);
    if (!socket.connected) socket.connect();
    socket.emit("join-room", { projectId: project._id });
    toast.success(`Joined ${project.name}`);
    setActiveModal(null);
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

    socket.emit("send-message", messageData); // only emit
    try {
      await axios.post("http://localhost:5000/api/chat", messageData);
    } catch (err) {
      console.error("Error saving message:", err);
    }

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
        const res = await axios.post("http://localhost:5000/api/ai/reply", { prompt });
        const aiMessage = {
          projectId: currentProject._id,
          sender: "ai",
          senderId: "ai-bot",
          message: `🤖 ${res.data.reply}`,
          timestamp: new Date(),
        };

        socket.emit("send-message", aiMessage);
        await axios.post("http://localhost:5000/api/chat", aiMessage);
      } catch (err) {
        toast.error("AI couldn't respond.");
      } finally {
        setMessages((prev) => prev.filter((msg) => msg.sender !== "loading"));
        setIsLoading(false);
      }
    }
  };

  const updateFileContent = (fileName, newContent) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === fileName ? { ...f, content: newContent } : f))
    );
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    updateFileContent(activeFile, newCode);

    if (currentProject) {
      socket.emit("code-change", { projectId: currentProject._id, code: newCode });
    }
  };

  const handleRunCode = () => {
    try {
      const result = eval(code);
      setOutput(String(result));
    } catch (err) {
      setOutput("Error: " + err.message);
    }
    setShowOutput(true);
  };

  const toggleModal = (type) => {
    setActiveModal((prev) => (prev === type ? null : type));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName || !collaboratorEmail) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await api.post("/project/create", {
        name: projectName,
        collaboratorEmail,
      });
      toast.success("Project created successfully");
      fetchProjects();
      setActiveModal(null);
      setProjectName("");
      setCollaboratorEmail("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error creating project");
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
        code={code}
        setCode={setCode}
        handleCodeChange={handleCodeChange}
        handleRunCode={handleRunCode}
        output={output}
        showOutput={showOutput}
        setShowOutput={setShowOutput}
      />
    </div>
  );
}
