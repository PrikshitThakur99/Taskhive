const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitReview, getUserReviews } = require('../controllers/reviewController');

router.post('/', protect, submitReview);
router.get('/user/:userId', getUserReviews);

module.exports = router;
