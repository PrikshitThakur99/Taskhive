const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDashboardStats, getAllUsers, toggleBan,
  getAllTasks, getAllTransactions, deleteTask,
} = require('../controllers/adminController');

router.use(protect, adminOnly);
router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', toggleBan);
router.get('/tasks', getAllTasks);
router.delete('/tasks/:id', deleteTask);
router.get('/transactions', getAllTransactions);

module.exports = router;
