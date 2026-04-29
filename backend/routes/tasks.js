const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasks, getTask, createTask, updateTask,
  deleteTask, cancelTask, completeTask, getMyTasks,
} = require('../controllers/taskController');

router.get('/', getTasks);
router.get('/my', protect, getMyTasks);
router.get('/:id', getTask);
router.post('/', protect, createTask);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);
router.patch('/:id/cancel', protect, cancelTask);
router.patch('/:id/complete', protect, completeTask);

module.exports = router;
