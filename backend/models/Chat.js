const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  sender: {
    type: String,  // 'user' or 'ai'
    required: true,
    trim: true,
  },
  senderName: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Optional Index for faster querying by project and time
ChatSchema.index({ projectId: 1, timestamp: 1 });

module.exports = mongoose.model("Chat", ChatSchema);
