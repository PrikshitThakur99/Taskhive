const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUserProfile, updateProfile, changePassword, searchUsers, uploadMiddleware } = require('../controllers/userController');

router.get('/search', protect, searchUsers);
router.get('/:id', getUserProfile);
router.put('/profile', protect, uploadMiddleware, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
