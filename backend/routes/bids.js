const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { placeBid, getTaskBids, acceptBid, withdrawBid, getMyBids } = require('../controllers/bidController');

router.post('/', protect, placeBid);
router.get('/my', protect, getMyBids);
router.get('/task/:taskId', protect, getTaskBids);
router.patch('/:id/accept', protect, acceptBid);
router.delete('/:id', protect, withdrawBid);

module.exports = router;
