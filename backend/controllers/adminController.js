const User = require('../models/User');
const Task = require('../models/Task');
const Transaction = require('../models/Transaction');
const Bid = require('../models/Bid');
const Review = require('../models/Review');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalTasks, completedTasks, activeTasks,
      totalTransactions, bannedUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'in_progress' }),
      Transaction.countDocuments(),
      User.countDocuments({ isBanned: true }),
    ]);

    // Revenue (sum of all credits)
    const revenueAgg = await Transaction.aggregate([
      { $match: { type: { $in: ['credit', 'deposit'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Monthly signups last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyTasks = await Task.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalTasks, completedTasks, activeTasks, totalRevenue, totalTransactions, bannedUsers },
      monthlySignups,
      monthlyTasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, isBanned } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort('-createdAt').skip(skip).limit(Number(limit));

    res.json({ success: true, users, total, totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban/unban user
// @route   PATCH /api/admin/users/:id/ban
exports.toggleBan = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot ban admins' });

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks (admin)
// @route   GET /api/admin/tasks
exports.getAllTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, tasks, total, totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions (admin)
// @route   GET /api/admin/transactions
exports.getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Transaction.countDocuments();
    const transactions = await Transaction.find()
      .populate('user', 'name email')
      .populate('task', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, transactions, total, totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task (admin)
// @route   DELETE /api/admin/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    await Bid.deleteMany({ task: req.params.id });
    res.json({ success: true, message: 'Task deleted by admin' });
  } catch (error) {
    next(error);
  }
};
