const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [1, 'Bid must be at least $1'],
  },
  message: {
    type: String,
    required: [true, 'Proposal message is required'],
    minlength: 10,
    maxlength: 1000,
  },
  deliveryDays: {
    type: Number,
    required: true,
    min: 1,
    max: 365,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// One bid per user per task
bidSchema.index({ task: 1, bidder: 1 }, { unique: true });
bidSchema.index({ task: 1, status: 1 });
bidSchema.index({ bidder: 1 });

module.exports = mongoose.model('Bid', bidSchema);
