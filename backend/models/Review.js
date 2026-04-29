const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    minlength: 10,
    maxlength: 500,
  },
  type: {
    type: String,
    enum: ['client_to_worker', 'worker_to_client'],
    required: true,
  },
}, { timestamps: true });

// One review per reviewer per task
reviewSchema.index({ task: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1 });

module.exports = mongoose.model('Review', reviewSchema);
