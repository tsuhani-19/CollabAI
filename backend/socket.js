const { Server } = require("socket.io");
const Chat = require("./models/Chat");
const Project = require("./models/Project");
const Version = require("./models/Version"); // new model for versioning

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // change for production
      methods: ["GET", "POST"],
    },
  });

  const onlineUsers = new Map(); // Track online users

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    /**
     * -------------------------
     * JOIN PROJECT ROOM
     * -------------------------
     */
    socket.on("join-room", ({ projectId, userId }) => {
      if (!projectId || !userId) return;
      socket.join(projectId);
      socket.projectId = projectId;
      socket.userId = userId;

      onlineUsers.set(userId, socket.id);
      io.to(projectId).emit("update-online-users", Array.from(onlineUsers.keys()));

      socket.to(projectId).emit("user-joined", { userId });
      console.log(`📁 ${socket.id} joined room: ${projectId}`);
    });

    /**
     * -------------------------
     * CHAT MESSAGES (with read receipts)
     * -------------------------
     */
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
          readBy: [], // track readers
        };

        io.to(projectId).emit("receive-message", msgPayload);
        console.log("📨 Message broadcasted:", msgPayload.message);
      } catch (err) {
        console.error("❌ Error saving chat:", err.message);
      }
    });

    // Mark messages as read
    socket.on("mark-read", async ({ projectId, messageIds, userId }) => {
      try {
        await Chat.updateMany(
          { _id: { $in: messageIds }, projectId },
          { $addToSet: { readBy: userId } }
        );
        io.to(projectId).emit("messages-read", { messageIds, userId });
      } catch (err) {
        console.error("❌ Error marking read:", err.message);
      }
    });

    /**
     * -------------------------
     * TYPING INDICATOR
     * -------------------------
     */
    socket.on("typing", ({ projectId, userName }) => {
      socket.to(projectId).emit("show-typing", userName);
    });

    socket.on("stop-typing", ({ projectId, userName }) => {
      socket.to(projectId).emit("hide-typing", userName);
    });

    /**
     * -------------------------
     * CODE COLLAB (with version history)
     * -------------------------
     */
    socket.on("code-change", async ({ projectId, fileName = "App.js", code }) => {
      if (!projectId) return;

      try {
        await Project.findByIdAndUpdate(projectId, { code });

        // Save version for rollback (new feature)
        if (fileName && code) {
          await Version.create({ projectId, fileName, content: code });
        }
      } catch (err) {
        console.warn("⚠️ Could not save code:", err.message);
      }

      socket.to(projectId).emit("receive-code", code);
    });

    /**
     * -------------------------
     * FILE SYNC (unchanged)
     * -------------------------
     */
    socket.on("sync-files", async ({ projectId, files }) => {
      if (!projectId) return;

      try {
        await Project.findByIdAndUpdate(projectId, { files });
        socket.to(projectId).emit("sync-files", files);
      } catch (err) {
        console.warn("⚠️ Could not sync files:", err.message);
      }
    });

    /**
     * -------------------------
     * UPDATE SINGLE FILE (unchanged)
     * -------------------------
     */
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

    /**
     * -------------------------
     * DISCONNECT
     * -------------------------
     */
    socket.on("disconnect", () => {
      if (socket.projectId && socket.userId) {
        socket.to(socket.projectId).emit("user-left", { userId: socket.userId });
      }
      // Remove from online users list
      for (let [id, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(id);
        }
      }
      io.emit("update-online-users", Array.from(onlineUsers.keys()));
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
}

module.exports = setupSocket;
