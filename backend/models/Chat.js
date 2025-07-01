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
    required: false, // not required for AI
  },
  sender: {
    type: String, // 'user' or 'ai'
    required: true,
  },
  senderName: {
    type: String, // actual name (e.g., "Suhani Tiwari")
    required: false, // required for user, not for ai
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model("Chat", ChatSchema);
