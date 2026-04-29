const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const reviewSnapshotSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    maxlength: 300,
    default: '',
  },
  university: {
    type: String,
    default: '',
  },
  skills: [{ type: String, trim: true }],
  walletBalance: {
    type: Number,
    default: 100, // Start with $100 demo balance
    min: 0,
  },
  escrowBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalEarned: {
    type: Number,
    default: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
  },
  completedTasksCount: {
    type: Number,
    default: 0,
  },
  postedTasksCount: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  reviews: [reviewSnapshotSchema],
  isBanned: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: true, // simplified for demo
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update average rating
userSchema.methods.updateRating = function (newRating) {
  const total = this.totalReviews * this.averageRating + newRating;
  this.totalReviews += 1;
  this.averageRating = parseFloat((total / this.totalReviews).toFixed(2));
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
