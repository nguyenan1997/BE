const express = require('express');
const router = express.Router();
const { 
  createSchedule,
  getUserSchedules,
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
  runScheduleNow
} = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { 
  validateUpdateSchedule, 
  validateScheduleQuery,
  validateScheduleTime
} = require('../validators/scheduleValidator');

// All routes require authentication
router.post('/', authenticateToken, validateScheduleTime, createSchedule);
router.get('/', authenticateToken, validateScheduleQuery, getUserSchedules);
router.put('/:id', authenticateToken, validateUpdateSchedule, updateSchedule);
router.delete('/:id', authenticateToken, deleteSchedule);
router.patch('/:id/toggle', authenticateToken, toggleSchedule);
router.post('/:id/run', authenticateToken, runScheduleNow);

module.exports = router; 