const { 
  createOrUpdateSchedule, 
  getUserSchedule, 
  toggleSchedule, 
  deleteSchedule 
} = require('../services/scheduleService');

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Lấy lịch kiểm tra của user
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lịch của user
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
 *                     schedule:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         time_of_day: { type: string, example: "09:00:00" }
 *                         start_date: { type: string, example: "2024-01-20" }
 *                         is_active: { type: boolean }
 *                         last_run_at: { type: string }
 *                         next_run_at: { type: string }
 *                         run_count: { type: integer }
 *       404:
 *         description: User chưa có lịch
 */
// GET /api/schedules - Lấy lịch của user
const getSchedule = async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const schedule = await getUserSchedule(userId);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'User does not have a schedule'
      });
    }

    res.json({
      success: true,
      data: {
        schedule: {
          id: schedule.id,
          time_of_day: schedule.time_of_day,
          start_date: schedule.start_date,
          is_active: schedule.is_active,
          last_run_at: schedule.last_run_at,
          next_run_at: schedule.next_run_at,
          run_count: schedule.run_count,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Tạo hoặc cập nhật lịch kiểm tra
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
 *         description: Tạo/cập nhật lịch thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
// POST /api/schedules - Tạo hoặc cập nhật lịch
const createOrUpdateScheduleHandler = async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const { time_of_day, start_date, is_active = true } = req.body;

    // Validation
    if (!time_of_day || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'time_of_day and start_date are required'
      });
    }

    // Validate time format (HH:MM:SS)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(time_of_day)) {
      return res.status(400).json({
        success: false,
        message: 'time_of_day must be in format HH:MM:SS'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date)) {
      return res.status(400).json({
        success: false,
        message: 'start_date must be in format YYYY-MM-DD'
      });
    }

    // Validate start_date is not in the past
    const startDate = new Date(start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: 'start_date cannot be in the past'
      });
    }

    const schedule = await createOrUpdateSchedule(userId, {
      time_of_day,
      start_date,
      is_active
    });

    res.json({
      success: true,
      message: schedule.created_at === schedule.updated_at ? 
        'Schedule created successfully' : 'Schedule updated successfully',
      data: {
        schedule: {
          id: schedule.id,
          time_of_day: schedule.time_of_day,
          start_date: schedule.start_date,
          is_active: schedule.is_active,
          last_run_at: schedule.last_run_at,
          next_run_at: schedule.next_run_at,
          run_count: schedule.run_count,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/schedules/toggle:
 *   patch:
 *     summary: Bật/tắt lịch kiểm tra
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
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
 *       404:
 *         description: User chưa có lịch
 */
// PATCH /api/schedules/toggle - Bật/tắt lịch
const toggleScheduleStatus = async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean'
      });
    }

    const schedule = await toggleSchedule(userId, is_active);

    res.json({
      success: true,
      message: `Schedule ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: {
        schedule: {
          id: schedule.id,
          time_of_day: schedule.time_of_day,
          start_date: schedule.start_date,
          is_active: schedule.is_active,
          last_run_at: schedule.last_run_at,
          next_run_at: schedule.next_run_at,
          run_count: schedule.run_count
        }
      }
    });
  } catch (error) {
    if (error.message === 'User does not have a schedule') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @swagger
 * /api/schedules:
 *   delete:
 *     summary: Xóa lịch kiểm tra
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Xóa lịch thành công
 *       404:
 *         description: User chưa có lịch
 */
// DELETE /api/schedules - Xóa lịch
const deleteUserSchedule = async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const result = await deleteSchedule(userId);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    if (error.message === 'User does not have a schedule') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @swagger
 * /api/schedules/run-now:
 *   post:
 *     summary: Chạy lịch ngay lập tức
 *     tags: [Schedule]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Chạy lịch thành công
 *       404:
 *         description: User chưa có lịch
 */
// POST /api/schedules/run-now - Chạy lịch ngay
const runScheduleNow = async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const schedule = await getUserSchedule(userId);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'User does not have a schedule'
      });
    }

    if (!schedule.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Schedule is not active'
      });
    }

    // Import executeUserSchedule here to avoid circular dependency
    const { executeUserSchedule } = require('../services/scheduleService');
    
    // Chạy lịch ngay lập tức
    await executeUserSchedule(schedule);

    res.json({
      success: true,
      message: 'Schedule executed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedule,
  createOrUpdateScheduleHandler,
  toggleScheduleStatus,
  deleteUserSchedule,
  runScheduleNow
}; 