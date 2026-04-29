const Task = require('../models/Task');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Get all tasks with filters
// @route   GET /api/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const {
      status = 'open', category, minBudget, maxBudget,
      skills, search, sort = '-createdAt', page = 1, limit = 12,
    } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (category) query.category = category;
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }
    if (skills) {
      const skillArr = skills.split(',').map(s => s.trim());
      query.requiredSkills = { $in: skillArr };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('createdBy', 'name avatar averageRating university')
      .populate('assignedTo', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: tasks.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('createdBy', 'name avatar averageRating university skills bio completedTasksCount')
      .populate('assignedTo', 'name avatar averageRating completedTasksCount')
      .populate('acceptedBid');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Get bids for this task
    const bids = await Bid.find({ task: task._id })
      .populate('bidder', 'name avatar averageRating completedTasksCount skills')
      .sort('-createdAt');

    res.json({ success: true, task, bids });
  } catch (error) {
    next(error);
  }
};

// @desc    Create task
// @route   POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, category, budget, deadline, requiredSkills, tags } = req.body;

    if (!title || !description || !budget || !deadline || !category) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    if (new Date(deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'Deadline must be in the future' });
    }

    const task = await Task.create({
      title,
      description,
      category,
      budget: Number(budget),
      deadline: new Date(deadline),
      requiredSkills: requiredSkills || [],
      tags: tags || [],
      createdBy: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { postedTasksCount: 1 } });

    await task.populate('createdBy', 'name avatar averageRating university');

    // Emit to socket
    const io = req.app.get('io');
    if (io) io.emit('task:new', task);

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this task' });
    }

    if (task.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Can only edit open tasks' });
    }

    const allowed = ['title', 'description', 'category', 'budget', 'deadline', 'requiredSkills', 'tags'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    await task.populate('createdBy', 'name avatar averageRating university');
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    if (task.status === 'in_progress') {
      return res.status(400).json({ success: false, message: 'Cannot delete an in-progress task' });
    }

    await Bid.deleteMany({ task: task._id });
    await task.deleteOne();

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel task
// @route   PATCH /api/tasks/:id/cancel
exports.cancelTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(task.status)) {
      return res.status(400).json({ success: false, message: 'Task already finalized' });
    }

    // Refund escrow if in_progress
    if (task.status === 'in_progress' && task.acceptedAmount > 0) {
      const creator = await User.findById(task.createdBy);
      const before = creator.walletBalance;
      creator.walletBalance += task.acceptedAmount;
      creator.escrowBalance = Math.max(0, creator.escrowBalance - task.acceptedAmount);
      await creator.save();

      await Transaction.create({
        user: task.createdBy,
        type: 'refund',
        amount: task.acceptedAmount,
        description: `Refund: Task "${task.title}" cancelled`,
        task: task._id,
        balanceBefore: before,
        balanceAfter: creator.walletBalance,
      });
    }

    task.status = 'cancelled';
    await task.save();

    res.json({ success: true, message: 'Task cancelled', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark task completed & release escrow
// @route   PATCH /api/tasks/:id/complete
exports.completeTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the task creator can mark it complete' });
    }

    if (task.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Task must be in progress to complete' });
    }

    if (task.escrowReleased) {
      return res.status(400).json({ success: false, message: 'Payment already released' });
    }

    const worker = await User.findById(task.assignedTo);
    const creator = await User.findById(task.createdBy);

    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    const amount = task.acceptedAmount;

    // Release escrow to worker
    const workerBefore = worker.walletBalance;
    worker.walletBalance += amount;
    worker.totalEarned += amount;
    worker.completedTasksCount += 1;
    await worker.save();

    // Deduct escrow from creator
    creator.escrowBalance = Math.max(0, creator.escrowBalance - amount);
    creator.totalSpent += amount;
    await creator.save();

    // Transaction logs
    await Transaction.create({
      user: worker._id,
      type: 'credit',
      amount,
      description: `Payment for: "${task.title}"`,
      task: task._id,
      relatedUser: creator._id,
      balanceBefore: workerBefore,
      balanceAfter: worker.walletBalance,
    });

    await Transaction.create({
      user: creator._id,
      type: 'escrow_release',
      amount,
      description: `Escrow released for: "${task.title}"`,
      task: task._id,
      relatedUser: worker._id,
      balanceBefore: creator.escrowBalance + amount,
      balanceAfter: creator.escrowBalance,
    });

    task.status = 'completed';
    task.completedAt = new Date();
    task.escrowReleased = true;
    await task.save();

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.to(worker._id.toString()).emit('task:completed', {
        taskId: task._id,
        title: task.title,
        amount,
      });
    }

    res.json({ success: true, message: `Payment of $${amount} released to ${worker.name}`, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks by current user
// @route   GET /api/tasks/my/posted
exports.getMyTasks = async (req, res, next) => {
  try {
    const { type = 'posted' } = req.query;
    let query = {};
    if (type === 'posted') {
      query.createdBy = req.user._id;
    } else if (type === 'assigned') {
      query.assignedTo = req.user._id;
    }
    const tasks = await Task.find(query)
      .populate('createdBy', 'name avatar')
      .populate('assignedTo', 'name avatar')
      .sort('-createdAt');
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};
