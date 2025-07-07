const express = require('express');
const { 
  getSchedule, 
  createOrUpdateScheduleHandler, 
  toggleScheduleStatus, 
  deleteUserSchedule, 
  runScheduleNow 
} = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/schedules - Lấy lịch của user
router.get('/', getSchedule);

// POST /api/schedules - Tạo hoặc cập nhật lịch
router.post('/', createOrUpdateScheduleHandler);

// PATCH /api/schedules/toggle - Bật/tắt lịch
router.patch('/toggle', toggleScheduleStatus);

// DELETE /api/schedules - Xóa lịch
router.delete('/', deleteUserSchedule);

// POST /api/schedules/run-now - Chạy lịch ngay
router.post('/run-now', runScheduleNow);

module.exports = router; 