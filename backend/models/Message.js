const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: 2000,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
  conversationId: {
    type: String,
    required: true, // sorted user IDs joined: "uid1_uid2"
  },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
