const Chat = require("../models/Chat");

// Get all chats for a project
exports.getChatsByProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const chats = await Chat.find({ projectId }).sort({ timestamp: 1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
};

// Save a new chat message
exports.createChatMessageAPI = async (req, res) => {
  const { projectId, sender, message } = req.body;
  const senderId = req.user?._id || null; // Assuming you're using auth middleware

  if (!projectId || !sender || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const chat = new Chat({
      projectId,
      sender,      // 'user' or 'ai'
      senderId,    // store user ID only if sender is 'user'
      message,
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ error: "Failed to save chat message" });
  }
};
