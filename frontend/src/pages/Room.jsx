import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";

export default function Room() {
  const { projectId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
      socket.emit("join-room", { projectId });
    }

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, { type: "other", text: msg }]);
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId]);

  const sendMessage = () => {
    if (text.trim() === "") return;
    socket.emit("send-message", { projectId, message: text });
    setMessages((prev) => [...prev, { type: "self", text }]);
    setText("");
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d0d1a] text-white p-6">
      <h2 className="text-xl font-bold mb-4">Project Room: {projectId}</h2>
      <div className="flex-1 overflow-y-auto bg-[#1a1a2e] p-4 rounded mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded mb-2 w-fit max-w-xs text-sm ${
              msg.type === "self" ? "ml-auto bg-blue-500" : "bg-gray-700"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          type="text"
          placeholder="Type a message..."
          className="flex-1 p-2 rounded bg-[#1f1f30] border border-gray-600"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}