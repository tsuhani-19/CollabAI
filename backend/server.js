const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
require("dotenv").config();

//

const authRoutes = require("./routes/authRoutes.js");
const projectRoutes = require("./routes/projectRoutes.js");
const setupSocket = require("./socket.js");

const app = express();
const server = http.createServer(app);
setupSocket(server);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB error:", err));

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
