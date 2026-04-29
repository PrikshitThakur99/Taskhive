const Bid = require('../models/Bid');
const Task = require('../models/Task');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Place a bid
// @route   POST /api/bids
exports.placeBid = async (req, res, next) => {
  try {
    const { taskId, amount, message, deliveryDays } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This task is no longer accepting bids' });
    }

    if (task.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot bid on your own task' });
    }

    const existing = await Bid.findOne({ task: taskId, bidder: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already placed a bid on this task' });
    }

    const bid = await Bid.create({
      task: taskId,
      bidder: req.user._id,
      amount: Number(amount),
      message,
      deliveryDays: Number(deliveryDays),
    });

    await Task.findByIdAndUpdate(taskId, { $inc: { bidsCount: 1 } });

    await bid.populate('bidder', 'name avatar averageRating completedTasksCount skills');

    // Notify task owner
    const io = req.app.get('io');
    if (io) {
      io.to(task.createdBy.toString()).emit('bid:new', {
        taskId,
        taskTitle: task.title,
        bidder: req.user.name,
        amount,
      });
    }

    res.status(201).json({ success: true, bid });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bids for a task
// @route   GET /api/bids/task/:taskId
exports.getTaskBids = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const bids = await Bid.find({ task: req.params.taskId })
      .populate('bidder', 'name avatar averageRating completedTasksCount skills university bio')
      .sort('-createdAt');

    res.json({ success: true, bids });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a bid
// @route   PATCH /api/bids/:id/accept
exports.acceptBid = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('bidder', 'name email');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    const task = await Task.findById(bid.task);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the task owner can accept bids' });
    }

    if (task.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Task is no longer open' });
    }

    const creator = await User.findById(req.user._id);

    if (creator.walletBalance < bid.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You need $${bid.amount} but have $${creator.walletBalance.toFixed(2)}`,
      });
    }

    // Lock escrow
    const balanceBefore = creator.walletBalance;
    creator.walletBalance -= bid.amount;
    creator.escrowBalance += bid.amount;
    await creator.save();

    await Transaction.create({
      user: creator._id,
      type: 'escrow_lock',
      amount: bid.amount,
      description: `Escrow locked for: "${task.title}"`,
      task: task._id,
      relatedUser: bid.bidder._id,
      balanceBefore,
      balanceAfter: creator.walletBalance,
    });

    // Update bid & task
    bid.status = 'accepted';
    await bid.save();

    // Reject all other bids
    await Bid.updateMany(
      { task: task._id, _id: { $ne: bid._id } },
      { status: 'rejected' }
    );

    task.status = 'in_progress';
    task.assignedTo = bid.bidder._id;
    task.acceptedBid = bid._id;
    task.acceptedAmount = bid.amount;
    await task.save();

    // Notify worker
    const io = req.app.get('io');
    if (io) {
      io.to(bid.bidder._id.toString()).emit('bid:accepted', {
        taskId: task._id,
        taskTitle: task.title,
        amount: bid.amount,
      });
    }

    res.json({ success: true, message: `Bid accepted! $${bid.amount} locked in escrow.`, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update/withdraw a bid
// @route   DELETE /api/bids/:id
exports.withdrawBid = async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    if (bid.bidder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only withdraw pending bids' });
    }

    bid.status = 'withdrawn';
    await bid.save();
    await Task.findByIdAndUpdate(bid.task, { $inc: { bidsCount: -1 } });

    res.json({ success: true, message: 'Bid withdrawn' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my bids
// @route   GET /api/bids/my
exports.getMyBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({ bidder: req.user._id })
      .populate('task', 'title status budget deadline category createdBy')
      .populate({ path: 'task', populate: { path: 'createdBy', select: 'name avatar' } })
      .sort('-createdAt');
    res.json({ success: true, bids });
  } catch (error) {
    next(error);
  }
};
