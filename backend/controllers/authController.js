const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      skills: user.skills,
      university: user.university,
      walletBalance: user.walletBalance,
      escrowBalance: user.escrowBalance,
      totalEarned: user.totalEarned,
      completedTasksCount: user.completedTasksCount,
      averageRating: user.averageRating,
      totalReviews: user.totalReviews,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password, skills, university, bio } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      skills: skills || [],
      university: university || '',
      bio: bio || '',
      walletBalance: 100, // Welcome bonus
    });

    // Log welcome bonus transaction
    await Transaction.create({
      user: user._id,
      type: 'deposit',
      amount: 100,
      description: 'Welcome bonus — TaskHive starter balance',
      balanceBefore: 0,
      balanceAfter: 100,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout (client-side token removal)
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
