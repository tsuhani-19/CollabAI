const Chat = require('../models/Chat.js');
const User = require('../models/User.js');

exports.getChatsByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const chats = await Chat.find({ projectId }).sort({ timestamp: 1 });
    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat history', error: err.message });
  }
};

exports.createChatMessageAPI = async (req, res) => {
  const { projectId, sender, message } = req.body;

  if (!projectId || !message || !sender) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    let name = "";

    if (sender === "user") {
      const user = await User.findById(req.user._id).select("name");
      if (!user) return res.status(404).json({ message: "User not found" });
      name = user.name;
    } else {
      name = "AI";
    }

    const newMessage = new Chat({
      projectId,
      sender,
      senderId: sender === "user" ? req.user._id : null,
      senderName: name,
      message,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ message: "Failed to send message", error: err.message });
  }
};
