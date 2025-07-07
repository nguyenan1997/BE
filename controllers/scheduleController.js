const { 
  createSchedule, 
  getUserSchedules, 
  toggleSchedule, 
  deleteSchedule, 
  updateSchedule 
} = require('../services/scheduleService');

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Lấy tất cả lịch kiểm tra của user
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Danh sách lịch của user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     schedules:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Schedule'
 *
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         time_of_day: { type: string, example: "09:00:00" }
 *         start_date: { type: string, example: "2024-01-20" }
 *         is_active: { type: boolean }
 *         last_run_at: { type: string, nullable: true }
 *         next_run_at: { type: string }
 *         run_count: { type: integer }
 *         created_at: { type: string }
 *         updated_at: { type: string }
 */
// GET /api/schedules - Lấy tất cả lịch của user
const getSchedules = async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const schedules = await getUserSchedules(userId);
    res.json({
      success: true,
      data: { schedules }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Tạo mới một lịch kiểm tra
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - time_of_day
 *               - start_date
 *             properties:
 *               time_of_day:
 *                 type: string
 *                 format: time
 *                 example: "09:00:00"
 *                 description: Giờ chạy (HH:MM:SS)
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-20"
 *                 description: Ngày bắt đầu (YYYY-MM-DD)
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Bật/tắt lịch
 *     responses:
 *       200:
 *         description: Tạo lịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     schedule:
 *                       $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
// POST /api/schedules - Tạo lịch mới
const createScheduleHandler = async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const { time_of_day, start_date, is_active = true } = req.body;
    // Validation như cũ...
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!time_of_day || !timeRegex.test(time_of_day)) {
      return res.status(400).json({ success: false, message: 'time_of_day must be in format HH:MM:SS' });
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!start_date || !dateRegex.test(start_date)) {
      return res.status(400).json({ success: false, message: 'start_date must be in format YYYY-MM-DD' });
    }
    const startDate = new Date(start_date);
    const today = new Date(); today.setHours(0,0,0,0);
    if (startDate < today) {
      return res.status(400).json({ success: false, message: 'start_date cannot be in the past' });
    }
    const schedule = await createSchedule(userId, { time_of_day, start_date, is_active });
    res.json({ success: true, message: 'Schedule created successfully', data: { schedule } });
  } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/schedules/{id}/toggle:
 *   patch:
 *     summary: Bật/tắt một lịch kiểm tra cụ thể
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lịch
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 description: Bật (true) hoặc tắt (false) lịch
 *     responses:
 *       200:
 *         description: Bật/tắt lịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     schedule:
 *                       $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Không tìm thấy lịch
 */
// PATCH /api/schedules/:id/toggle - Bật/tắt lịch cụ thể
const toggleScheduleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'is_active must be a boolean' });
    }
    const schedule = await toggleSchedule(id, is_active);
    res.json({ success: true, message: `Schedule ${is_active ? 'activated' : 'deactivated'} successfully`, data: { schedule } });
  } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Xóa một lịch kiểm tra cụ thể
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lịch
 *     responses:
 *       200:
 *         description: Xóa lịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       404:
 *         description: Không tìm thấy lịch
 */
// DELETE /api/schedules/:id - Xóa lịch cụ thể
const deleteUserSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteSchedule(id);
    res.json({ success: true, message: result.message });
  } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/schedules/{id}/run-now:
 *   post:
 *     summary: Chạy một lịch kiểm tra ngay lập tức
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lịch
 *     responses:
 *       200:
 *         description: Chạy lịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *       404:
 *         description: Không tìm thấy lịch
 */
// POST /api/schedules/:id/run-now - Chạy lịch ngay
const runScheduleNow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await require('../models/UserSchedule').findByPk(id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    if (!schedule.is_active) return res.status(400).json({ success: false, message: 'Schedule is not active' });
    const { executeUserSchedule } = require('../services/scheduleService');
    await executeUserSchedule(schedule);
    res.json({ success: true, message: 'Schedule executed successfully' });
  } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/schedules/{id}:
 *   put:
 *     summary: Sửa toàn bộ thông tin một lịch kiểm tra cụ thể
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lịch
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - time_of_day
 *               - start_date
 *               - is_active
 *             properties:
 *               time_of_day:
 *                 type: string
 *                 format: time
 *                 example: "09:00:00"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-20"
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Sửa lịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     schedule:
 *                       $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Không tìm thấy lịch
 */
const updateScheduleHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { time_of_day, start_date, is_active } = req.body;
    // Validate nếu có time_of_day hoặc start_date
    if (time_of_day) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeRegex.test(time_of_day)) {
        return res.status(400).json({ success: false, message: 'time_of_day must be in format HH:MM:SS' });
      }
    }
    if (start_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date)) {
        return res.status(400).json({ success: false, message: 'start_date must be in format YYYY-MM-DD' });
      }
    }
    const updateData = {};
    if (time_of_day !== undefined) updateData.time_of_day = time_of_day;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (is_active !== undefined) updateData.is_active = is_active;
    const schedule = await updateSchedule(id, updateData);
    res.json({ success: true, message: 'Schedule updated successfully', data: { schedule } });
  } catch (error) { next(error); }
};

module.exports = {
  getSchedules,
  createScheduleHandler,
  toggleScheduleStatus,
  deleteUserSchedule,
  runScheduleNow,
  updateScheduleHandler
}; 