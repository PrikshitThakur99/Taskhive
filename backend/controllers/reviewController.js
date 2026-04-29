const Review = require('../models/Review');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Submit review
// @route   POST /api/reviews
exports.submitReview = async (req, res, next) => {
  try {
    const { taskId, rating, comment } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Task must be completed before reviewing' });
    }

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isWorker = task.assignedTo?.toString() === req.user._id.toString();

    if (!isCreator && !isWorker) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this task' });
    }

    const existing = await Review.findOne({ task: taskId, reviewer: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already reviewed this task' });
    }

    const revieweeId = isCreator ? task.assignedTo : task.createdBy;
    const type = isCreator ? 'client_to_worker' : 'worker_to_client';

    const review = await Review.create({
      task: taskId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating: Number(rating),
      comment,
      type,
    });

    // Update reviewee's average rating
    const reviewee = await User.findById(revieweeId);
    reviewee.updateRating(Number(rating));

    // Add to reviews array
    reviewee.reviews.push({
      reviewer: req.user._id,
      rating: Number(rating),
      comment,
      task: taskId,
    });

    await reviewee.save();

    await review.populate('reviewer', 'name avatar');

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .populate('task', 'title')
      .sort('-createdAt');

    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};
