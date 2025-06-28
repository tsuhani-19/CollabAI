const { Server } = require("socket.io");
const Chat = require("./models/Chat");
const Project = require("./models/Project");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Change in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // ✅ Join a project room
    socket.on("join-room", ({ projectId, userId }) => {
      socket.join(projectId);
      socket.projectId = projectId;
      socket.userId = userId;

      socket.to(projectId).emit("user-joined", { userId });
      console.log(`📁 ${socket.id} joined room: ${projectId}`);
    });

    // ✅ Handle chat messages
    socket.on("send-message", async ({ projectId, sender = "user", senderId, message }) => {
      try {
        const chat = new Chat({
          projectId,
          sender,
          senderId: sender === "user" ? senderId : null,
          message,
        });
        await chat.save();

        const msgPayload = {
          sender,
          senderId: chat.senderId,
          message,
          timestamp: chat.timestamp,
        };

        io.to(projectId).emit("receive-message", msgPayload);
      } catch (err) {
        console.error("❌ Error saving chat:", err.message);
      }
    });

    // ✅ Code collaboration
    socket.on("code-change", async ({ projectId, code }) => {
      try {
        await Project.findByIdAndUpdate(projectId, { code });
      } catch (err) {
        console.warn("⚠️ Could not save code:", err.message);
      }

      socket.to(projectId).emit("receive-code", code);
    });

    // ✅ Sync entire file/folder structure
    socket.on("sync-files", async ({ projectId, files }) => {
      try {
        await Project.findByIdAndUpdate(projectId, { files });
        socket.to(projectId).emit("sync-files", files);
      } catch (err) {
        console.warn("⚠️ Could not sync files:", err.message);
      }
    });

    // ✅ Update a single file by ID (optional, recommended)
    socket.on("update-file", async ({ projectId, fileId, newContent }) => {
      try {
        const project = await Project.findById(projectId);
        if (!project) return;

        const updateFile = (files) => {
          for (let file of files) {
            if (file.id === fileId) {
              file.content = newContent;
              return true;
            }
            if (file.type === "folder" && file.children?.length) {
              if (updateFile(file.children)) return true;
            }
          }
          return false;
        };

        updateFile(project.files);
        await project.save();

        socket.to(projectId).emit("file-updated", { fileId, newContent });
      } catch (err) {
        console.error("❌ Error updating file:", err.message);
      }
    });

    // ✅ Notify on disconnect
    socket.on("disconnect", () => {
      if (socket.projectId && socket.userId) {
        socket.to(socket.projectId).emit("user-left", { userId: socket.userId });
      }
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
}

module.exports = setupSocket;
