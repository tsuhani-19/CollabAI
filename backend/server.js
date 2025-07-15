const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes.js");
const projectRoutes = require("./routes/projectRoutes.js");
const setupSocket = require("./socket.js");
const chatRoutes = require("./routes/chatRoutes.js");
const runRoute = require("./routes/runRoutes.js");
const websiteBuilderRoutes = require("./routes/websiteBuilder.js");
const saveProjectRoute = require("./routes/saveRoutes.js");

const app = express();
const server = http.createServer(app);

// Setup WebSocket
setupSocket(server);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB error:", err));

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/run", runRoute);
app.use("/api/generate-website", websiteBuilderRoutes);
app.use("/api/save-project", saveProjectRoute);

// ✅ Serve static preview from disk (important!)
const path = require("path");
app.use("/sites", express.static(path.join(__dirname, "generated-sites")));

// Dynamically load aiRoutes (ES Module)
(async () => {
  try {
    const aiRoutes = await import("./routes/aiRoutes.js");
    app.use("/api/ai", aiRoutes.default);
  } catch (error) {
    console.error("❌ Error loading AI routes:", error);
  }
})();

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
