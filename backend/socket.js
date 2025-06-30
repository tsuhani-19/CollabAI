const { Server } = require("socket.io");
const Chat = require("./models/Chat");
const Project = require("./models/Project");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // 🛑 Change this in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // 🔹 Join a project room
    socket.on("join-room", ({ projectId, userId }) => {
      if (!projectId || !userId) return;
      socket.join(projectId);
      socket.projectId = projectId;
      socket.userId = userId;

      socket.to(projectId).emit("user-joined", { userId });
      console.log(`📁 ${socket.id} joined room: ${projectId}`);
    });

    // 💬 Handle sending a chat message
    socket.on("send-message", async ({ projectId, sender = "user", senderId, message }) => {
      if (!projectId || !message) return;

      try {
        const chat = new Chat({
          projectId,
          sender,
          senderId: sender === "user" ? senderId : null,
          message,
        });

        await chat.save();

        const msgPayload = {
          _id: chat._id,
          projectId: chat.projectId,
          sender: chat.sender,
          senderId: chat.senderId,
          message: chat.message,
          timestamp: chat.timestamp,
        };

        io.to(projectId).emit("receive-message", msgPayload);
        console.log("📨 Message broadcasted:", msgPayload.message);
      } catch (err) {
        console.error("❌ Error saving chat:", err.message);
      }
    });

    // 🔧 Code collaboration sync
    socket.on("code-change", async ({ projectId, code }) => {
      if (!projectId) return;

      try {
        await Project.findByIdAndUpdate(projectId, { code });
      } catch (err) {
        console.warn("⚠️ Could not save code:", err.message);
      }

      socket.to(projectId).emit("receive-code", code);
    });

    // 🔁 Sync files/folders
    socket.on("sync-files", async ({ projectId, files }) => {
      if (!projectId) return;

      try {
        await Project.findByIdAndUpdate(projectId, { files });
        socket.to(projectId).emit("sync-files", files);
      } catch (err) {
        console.warn("⚠️ Could not sync files:", err.message);
      }
    });

    // ✏️ Optional: Update a single file
    socket.on("update-file", async ({ projectId, fileId, newContent }) => {
      try {
        const project = await Project.findById(projectId);
        if (!project || !project.files) return;

        const updateFile = (files) => {
          for (let file of files) {
            if (file.id === fileId) {
              file.content = newContent;
              return true;
            }
            if (file.type === "folder" && Array.isArray(file.children)) {
              if (updateFile(file.children)) return true;
            }
          }
          return false;
        };

        if (updateFile(project.files)) {
          await project.save();
          socket.to(projectId).emit("file-updated", { fileId, newContent });
        }
      } catch (err) {
        console.error("❌ Error updating file:", err.message);
      }
    });

    // ❌ Handle disconnects
    socket.on("disconnect", () => {
      if (socket.projectId && socket.userId) {
        socket.to(socket.projectId).emit("user-left", { userId: socket.userId });
      }
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
}

module.exports = setupSocket;
