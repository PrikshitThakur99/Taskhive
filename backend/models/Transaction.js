const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'escrow_lock', 'escrow_release', 'deposit', 'withdrawal', 'refund'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  reference: {
    type: String,
    default: () => Math.random().toString(36).substr(2, 12).toUpperCase(),
  },
}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ task: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
