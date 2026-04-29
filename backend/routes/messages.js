const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendMessage, getConversation, getConversations, getUnreadCount } = require('../controllers/messageController');

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:userId', protect, getConversation);
router.post('/', protect, sendMessage);

module.exports = router;
