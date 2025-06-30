const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getChatsByProject,
  createChatMessageAPI,
} = require('../controller/chatController');

// ✅ GET /api/chat/:projectId - Load chat history
router.get('/:projectId', auth, getChatsByProject);

// ✅ POST /api/chat - Send message
router.post('/', auth, createChatMessageAPI);

module.exports = router;
