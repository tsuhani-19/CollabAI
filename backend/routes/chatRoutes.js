const express = require('express');
const router = express.Router();
const { getChatsByProject, createChatMessageAPI } = require('../controller/chatController');

// GET /api/chat/:projectId - Load chat history
router.get('/:projectId', getChatsByProject);
router.post('/', createChatMessageAPI);

module.exports = router;
