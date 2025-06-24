const { Server } = require("socket.io");
const Project = require("./models/Project");

function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("🔌 New socket connected:", socket.id);

    socket.on("join-room", ({ projectId }) => {
      socket.join(projectId);
      console.log(`📁 Joined room: ${projectId}`);
    });

    socket.on("send-message", ({ projectId, message }) => {
      socket.to(projectId).emit("receive-message", message);
    });

    socket.on("code-change", ({ projectId, code }) => {
      socket.to(projectId).emit("receive-code", code);
    });
  });
}

module.exports = setupSocket;