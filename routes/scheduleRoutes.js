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
  validateCreateSchedule, 
  validateUpdateSchedule, 
  validateScheduleQuery,
  validateCronForm
} = require('../validators/scheduleValidator');

// Tất cả routes đều yêu cầu authentication
router.post('/', authenticateToken, validateCreateSchedule, createSchedule);
router.post('/form', authenticateToken, validateCronForm, createSchedule); // Tạo từ form đơn giản
router.get('/', authenticateToken, validateScheduleQuery, getUserSchedules);
router.put('/:id', authenticateToken, validateUpdateSchedule, updateSchedule);
router.delete('/:id', authenticateToken, deleteSchedule);
router.patch('/:id/toggle', authenticateToken, toggleSchedule);
router.post('/:id/run', authenticateToken, runScheduleNow);

module.exports = router; 