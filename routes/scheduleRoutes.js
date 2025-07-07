const express = require('express');
const { 
  getSchedules, 
  createScheduleHandler, 
  toggleScheduleStatus, 
  deleteUserSchedule, 
  runScheduleNow, 
  updateScheduleHandler 
} = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/schedules - Lấy tất cả lịch của user
router.get('/', getSchedules);

// POST /api/schedules - Tạo mới lịch
router.post('/', createScheduleHandler);

// PATCH /api/schedules/:id/toggle - Bật/tắt lịch cụ thể
router.patch('/:id/toggle', toggleScheduleStatus);

// DELETE /api/schedules/:id - Xóa lịch cụ thể
router.delete('/:id', deleteUserSchedule);

// POST /api/schedules/:id/run-now - Chạy lịch cụ thể
router.post('/:id/run-now', runScheduleNow);

// PUT /api/schedules/:id - Sửa toàn bộ thông tin một lịch cụ thể
router.put('/:id', updateScheduleHandler);

module.exports = router; 