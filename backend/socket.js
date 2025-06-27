const { Server } = require("socket.io");
const Chat = require("./models/Chat");

function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("🔌 New socket connected:", socket.id);

    // Join a project room
    socket.on("join-room", ({ projectId }) => {
      socket.join(projectId);
      console.log(`📁 Joined room: ${projectId}`);
    });

    // Handle chat messages and save them
    socket.on("send-message", async ({ projectId, sender = "user", senderId, message }) => {
      try {
        // Save chat in MongoDB
        const chat = new Chat({
          projectId,
          sender,
          senderId: sender === "user" ? senderId : null,
          message,
        });
        await chat.save();

        const msgPayload = {
          sender,
          senderId: chat.senderId,  // return this so frontend can align correctly
          message,
          timestamp: chat.timestamp,
        };

        // Emit to all in room including sender
        io.to(projectId).emit("receive-message", msgPayload);
      } catch (error) {
        console.error("❌ Failed to save chat message:", error.message);
      }
    });

    // Code collaboration
    socket.on("code-change", ({ projectId, code }) => {
      socket.to(projectId).emit("receive-code", code);
    });
  });
}

module.exports = setupSocket;
