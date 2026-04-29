const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: 5,
    maxlength: 100,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: 20,
    maxlength: 2000,
  },
  category: {
    type: String,
    required: true,
    enum: ['Design', 'Code', 'Writing', 'Data', 'Math', 'Research', 'Marketing', 'Video', 'Other'],
    default: 'Other',
  },
  requiredSkills: [{ type: String, trim: true }],
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [1, 'Budget must be at least $1'],
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  acceptedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null,
  },
  acceptedAmount: {
    type: Number,
    default: 0,
  },
  bidsCount: {
    type: Number,
    default: 0,
  },
  attachments: [{
    filename: String,
    url: String,
  }],
  completedAt: {
    type: Date,
    default: null,
  },
  escrowReleased: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  tags: [{ type: String, trim: true, lowercase: true }],
}, { timestamps: true });

// Text index for search
taskSchema.index({ title: 'text', description: 'text', tags: 'text' });
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ requiredSkills: 1 });

module.exports = mongoose.model('Task', taskSchema);
