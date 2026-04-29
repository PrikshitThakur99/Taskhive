const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getWallet, deposit, withdraw } = require('../controllers/walletController');

router.get('/', protect, getWallet);
router.post('/deposit', protect, deposit);
router.post('/withdraw', protect, withdraw);

module.exports = router;
