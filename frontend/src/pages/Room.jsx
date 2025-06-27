import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import { useUser } from "../context/UserContext"; // Make sure this is correctly implemented

export default function Room() {
  const { projectId } = useParams();
  const { user } = useUser(); // Access logged-in user's _id
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // Connect socket and join room
  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit("join-room", { projectId });

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]); // msg = { sender, senderId, message, timestamp }
    });

    return () => {
      socket.off("receive-message");
      socket.disconnect();
    };
  }, [projectId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to socket
  const sendMessage = () => {
    if (!text.trim()) return;

    const messageData = {
      projectId,
      sender: "user",
      senderId: user._id,
      message: text,
    };

    socket.emit("send-message", messageData);
    setMessages((prev) => [...prev, messageData]); // show message instantly
    setText("");
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d0d1a] text-white p-6">
      <h2 className="text-xl font-bold mb-4">Project Room: {projectId}</h2>

      {/* Chat box */}
      <div className="flex-1 overflow-y-auto bg-[#1a1a2e] p-4 rounded mb-4">
        {messages.map((msg, i) => {
          const isSelf = msg.sender === "user" && msg.senderId === user._id;

          return (
            <div
              key={i}
              className={`p-2 rounded mb-2 w-fit max-w-xs text-sm ${
                msg.sender === "ai"
                  ? "bg-[#37376e] text-green-300"
                  : isSelf
                  ? "ml-auto bg-blue-500"
                  : "bg-gray-700"
              }`}
            >
              {msg.message}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          type="text"
          placeholder="Type a message..."
          className="flex-1 p-2 rounded bg-[#1f1f30] border border-gray-600"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
