const Chat = require('../models/Chat');

exports.getChatsByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const chats = await Chat.find({ projectId }).sort({ timestamp: 1 });
    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat history' });
  }
};

exports.createChatMessageAPI = async (req, res) => {
  const { projectId, sender, senderId, message } = req.body;
  if (!projectId || !message) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const newMessage = new Chat({
      projectId,
      sender,
      senderId: sender === "user" ? req.user._id : null, // safest
      message,
      timestamp: new Date(),
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: "Failed to send message" });
  }
};
