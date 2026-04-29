const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Get wallet info & transactions
// @route   GET /api/wallet
exports.getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance escrowBalance totalEarned totalSpent');
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('task', 'title')
      .populate('relatedUser', 'name avatar')
      .sort('-createdAt')
      .limit(50);

    // Analytics: monthly earnings
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: { $in: ['credit', 'deposit'] },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      wallet: {
        balance: user.walletBalance,
        escrow: user.escrowBalance,
        totalEarned: user.totalEarned,
        totalSpent: user.totalSpent,
      },
      transactions,
      monthlyData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deposit funds (mock)
// @route   POST /api/wallet/deposit
exports.deposit = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const amt = Number(amount);

    if (!amt || amt < 1) {
      return res.status(400).json({ success: false, message: 'Please enter a valid amount (min $1)' });
    }
    if (amt > 10000) {
      return res.status(400).json({ success: false, message: 'Maximum deposit is $10,000' });
    }

    const user = await User.findById(req.user._id);
    const before = user.walletBalance;
    user.walletBalance += amt;
    await user.save();

    const tx = await Transaction.create({
      user: user._id,
      type: 'deposit',
      amount: amt,
      description: `Deposit via mock payment`,
      balanceBefore: before,
      balanceAfter: user.walletBalance,
    });

    res.json({
      success: true,
      message: `$${amt.toFixed(2)} deposited successfully`,
      newBalance: user.walletBalance,
      transaction: tx,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw funds (mock)
// @route   POST /api/wallet/withdraw
exports.withdraw = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const amt = Number(amount);

    if (!amt || amt < 1) {
      return res.status(400).json({ success: false, message: 'Please enter a valid amount' });
    }

    const user = await User.findById(req.user._id);

    if (amt > user.walletBalance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const before = user.walletBalance;
    user.walletBalance -= amt;
    await user.save();

    const tx = await Transaction.create({
      user: user._id,
      type: 'withdrawal',
      amount: amt,
      description: 'Withdrawal to bank account',
      balanceBefore: before,
      balanceAfter: user.walletBalance,
    });

    res.json({
      success: true,
      message: `$${amt.toFixed(2)} withdrawn successfully`,
      newBalance: user.walletBalance,
      transaction: tx,
    });
  } catch (error) {
    next(error);
  }
};
