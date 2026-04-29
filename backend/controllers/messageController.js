const Message = require('../models/Message');
const User = require('../models/User');

const getConversationId = (uid1, uid2) => {
  return [uid1.toString(), uid2.toString()].sort().join('_');
};

// @desc    Send message
// @route   POST /api/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, taskId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver and content required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ success: false, message: 'User not found' });

    const conversationId = getConversationId(req.user._id, receiverId);

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
      task: taskId || null,
      conversationId,
    });

    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId.toString()).emit('message:new', message);
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation messages
// @route   GET /api/messages/:userId
exports.getConversation = async (req, res, next) => {
  try {
    const conversationId = getConversationId(req.user._id, req.params.userId);

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatar')
      .sort('createdAt');

    // Mark as read
    await Message.updateMany(
      { conversationId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations
// @route   GET /api/messages/conversations
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: req.user._id }, { receiver: req.user._id }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$isRead', false] }, { $eq: ['$receiver', req.user._id] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate users
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv._id.split('_').find(id => id !== userId);
        const otherUser = await User.findById(otherUserId).select('name avatar lastActive');
        return { ...conv, otherUser };
      })
    );

    res.json({ success: true, conversations: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count
// @route   GET /api/messages/unread-count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
};
