const Task = require('../models/Task');
const User = require('../models/User');
const Bid = require('../models/Bid');

// @desc    Smart task recommendations
// @route   GET /api/recommendations
exports.getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const userSkills = user.skills || [];

    // Get tasks user already bid on
    const myBids = await Bid.find({ bidder: req.user._id }).select('task');
    const bidTaskIds = myBids.map(b => b.task.toString());

    // Get tasks posted by user
    const myTasks = await Task.find({ createdBy: req.user._id }).select('_id');
    const myTaskIds = myTasks.map(t => t._id.toString());

    const excluded = [...bidTaskIds, ...myTaskIds];

    let recommendations = [];

    // 1. Skill-based matching (primary)
    if (userSkills.length > 0) {
      const skillMatched = await Task.find({
        status: 'open',
        _id: { $nin: excluded },
        requiredSkills: { $in: userSkills.map(s => new RegExp(s, 'i')) },
      })
        .populate('createdBy', 'name avatar averageRating')
        .sort('-createdAt')
        .limit(6);

      skillMatched.forEach(task => {
        const matchedSkills = task.requiredSkills.filter(rs =>
          userSkills.some(us => rs.toLowerCase().includes(us.toLowerCase()) || us.toLowerCase().includes(rs.toLowerCase()))
        );
        recommendations.push({
          ...task.toObject(),
          recommendationReason: `Matches your skills: ${matchedSkills.slice(0, 2).join(', ')}`,
          matchScore: matchedSkills.length * 30,
        });
      });
    }

    // 2. Category-based from completed tasks
    const completedTaskIds = await Task.find({
      assignedTo: req.user._id,
      status: 'completed',
    }).select('category').limit(5);

    if (completedTaskIds.length > 0) {
      const categories = [...new Set(completedTaskIds.map(t => t.category))];
      const catExcluded = [...excluded, ...recommendations.map(r => r._id.toString())];

      const catMatched = await Task.find({
        status: 'open',
        _id: { $nin: catExcluded },
        category: { $in: categories },
      })
        .populate('createdBy', 'name avatar averageRating')
        .sort('-createdAt')
        .limit(4);

      catMatched.forEach(task => {
        recommendations.push({
          ...task.toObject(),
          recommendationReason: `Based on your past ${task.category} work`,
          matchScore: 20,
        });
      });
    }

    // 3. Popular / recent tasks (fallback)
    if (recommendations.length < 6) {
      const fallbackExcluded = [...excluded, ...recommendations.map(r => r._id.toString())];
      const popular = await Task.find({
        status: 'open',
        _id: { $nin: fallbackExcluded },
      })
        .populate('createdBy', 'name avatar averageRating')
        .sort({ bidsCount: -1, createdAt: -1 })
        .limit(6 - recommendations.length);

      popular.forEach(task => {
        recommendations.push({
          ...task.toObject(),
          recommendationReason: 'Trending on TaskHive',
          matchScore: 10,
        });
      });
    }

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, recommendations: recommendations.slice(0, 8) });
  } catch (error) {
    next(error);
  }
};
