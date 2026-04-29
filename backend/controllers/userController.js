const User = require('../models/User');
const Task = require('../models/Task');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar_${req.user._id}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'));
    }
    cb(null, true);
  },
});

exports.uploadMiddleware = upload.single('avatar');

// @desc    Get user profile
// @route   GET /api/users/:id
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [postedTasks, completedAsWorker] = await Promise.all([
      Task.find({ createdBy: user._id, status: { $in: ['open', 'in_progress'] } })
        .select('title budget status category createdAt')
        .limit(5),
      Task.find({ assignedTo: user._id, status: 'completed' })
        .select('title budget category completedAt')
        .limit(5),
    ]);

    res.json({ success: true, user, postedTasks, completedAsWorker });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills, university } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (skills) updates.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    if (university !== undefined) updates.university = university;

    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, skills } = req.query;
    const query = { isBanned: false };
    if (q) query.$or = [{ name: { $regex: q, $options: 'i' } }, { university: { $regex: q, $options: 'i' } }];
    if (skills) query.skills = { $in: skills.split(',').map(s => s.trim()) };

    const users = await User.find(query)
      .select('name avatar bio skills university averageRating totalReviews completedTasksCount')
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};
