const { Schedule, YouTubeChannel, User } = require('../models');
const cron = require('node-cron');
const { Op } = require('sequelize');

// Lưu trữ các job cron đang chạy
const activeJobs = new Map();

// Tạo lịch mới
const createSchedule = async (req, res) => {
  try {
    const { channelId, name, description, cronExpression, maxRuns, settings } = req.body;
    const userId = req.user.id;

    // Kiểm tra channel có tồn tại và thuộc về user không
    const channel = await YouTubeChannel.findOne({
      where: { id: channelId, analyzedBy: userId }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Kênh YouTube không tồn tại hoặc không thuộc về bạn'
      });
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      return res.status(400).json({
        success: false,
        message: 'Biểu thức cron không hợp lệ'
      });
    }

    // Tính toán thời gian chạy tiếp theo
    const nextRunAt = cron.getNextDate(cronExpression);

    const schedule = await Schedule.create({
      userId,
      channelId,
      name,
      description,
      cronExpression,
      maxRuns,
      settings,
      nextRunAt
    });

    // Tạo job cron nếu lịch đang active
    if (schedule.isActive) {
      createCronJob(schedule);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo lịch thành công',
      data: schedule
    });

  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Lấy danh sách lịch của user
const getUserSchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { userId };
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const schedules = await Schedule.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: YouTubeChannel,
          as: 'channel',
          attributes: ['id', 'channelName', 'imageUrl']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: schedules.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: schedules.count,
        totalPages: Math.ceil(schedules.count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting user schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Cập nhật lịch
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const schedule = await Schedule.findOne({
      where: { id, userId }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Lịch không tồn tại'
      });
    }

    // Validate cron expression nếu có cập nhật
    if (updateData.cronExpression && !cron.validate(updateData.cronExpression)) {
      return res.status(400).json({
        success: false,
        message: 'Biểu thức cron không hợp lệ'
      });
    }

    // Cập nhật thời gian chạy tiếp theo nếu cron expression thay đổi
    if (updateData.cronExpression) {
      updateData.nextRunAt = cron.getNextDate(updateData.cronExpression);
    }

    await schedule.update(updateData);

    // Cập nhật job cron
    updateCronJob(schedule);

    res.json({
      success: true,
      message: 'Cập nhật lịch thành công',
      data: schedule
    });

  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Xóa lịch
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const schedule = await Schedule.findOne({
      where: { id, userId }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Lịch không tồn tại'
      });
    }

    // Dừng job cron nếu đang chạy
    stopCronJob(schedule.id);

    await schedule.destroy();

    res.json({
      success: true,
      message: 'Xóa lịch thành công'
    });

  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Bật/tắt lịch
const toggleSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const schedule = await Schedule.findOne({
      where: { id, userId }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Lịch không tồn tại'
      });
    }

    schedule.isActive = !schedule.isActive;
    await schedule.save();

    if (schedule.isActive) {
      createCronJob(schedule);
    } else {
      stopCronJob(schedule.id);
    }

    res.json({
      success: true,
      message: `Đã ${schedule.isActive ? 'bật' : 'tắt'} lịch`,
      data: schedule
    });

  } catch (error) {
    console.error('Error toggling schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Chạy lịch ngay lập tức
const runScheduleNow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const schedule = await Schedule.findOne({
      where: { id, userId },
      include: [
        {
          model: YouTubeChannel,
          as: 'channel'
        }
      ]
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Lịch không tồn tại'
      });
    }

    // Chạy phân tích ngay lập tức
    await executeSchedule(schedule);

    res.json({
      success: true,
      message: 'Đã chạy lịch thành công'
    });

  } catch (error) {
    console.error('Error running schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

// Tạo job cron cho lịch
const createCronJob = (schedule) => {
  // Dừng job cũ nếu có
  stopCronJob(schedule.id);

  const job = cron.schedule(schedule.cronExpression, async () => {
    try {
      await executeSchedule(schedule);
    } catch (error) {
      console.error(`Error executing schedule ${schedule.id}:`, error);
    }
  }, {
    scheduled: false
  });

  activeJobs.set(schedule.id, job);
  job.start();
};

// Cập nhật job cron
const updateCronJob = (schedule) => {
  if (schedule.isActive) {
    createCronJob(schedule);
  } else {
    stopCronJob(schedule.id);
  }
};

// Dừng job cron
const stopCronJob = (scheduleId) => {
  const job = activeJobs.get(scheduleId);
  if (job) {
    job.stop();
    activeJobs.delete(scheduleId);
  }
};

// Thực thi lịch
const executeSchedule = async (schedule) => {
  try {
    // Kiểm tra số lần chạy tối đa
    if (schedule.maxRuns && schedule.runCount >= schedule.maxRuns) {
      await schedule.update({ isActive: false });
      stopCronJob(schedule.id);
      return;
    }

    // Import controller để chạy phân tích
    const { fetchAndAnalyze } = require('./youtubeController');
    
    // Tạo mock request object
    const mockReq = {
      user: { id: schedule.userId },
      body: { channelId: schedule.channelId }
    };

    // Tạo mock response object
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`Schedule ${schedule.id} executed with status ${code}:`, data);
        }
      })
    };

    // Chạy phân tích
    await fetchAndAnalyze(mockReq, mockRes);

    // Cập nhật thông tin lịch
    await schedule.update({
      lastRunAt: new Date(),
      runCount: schedule.runCount + 1,
      nextRunAt: cron.getNextDate(schedule.cronExpression)
    });

  } catch (error) {
    console.error(`Error executing schedule ${schedule.id}:`, error);
    
    // Cập nhật thông tin lỗi
    await schedule.update({
      lastRunAt: new Date(),
      runCount: schedule.runCount + 1
    });
  }
};

// Khởi tạo các job cron khi server start
const initializeSchedules = async () => {
  try {
    const activeSchedules = await Schedule.findAll({
      where: { isActive: true }
    });

    activeSchedules.forEach(schedule => {
      createCronJob(schedule);
    });

    console.log(`Initialized ${activeSchedules.length} active schedules`);
  } catch (error) {
    console.error('Error initializing schedules:', error);
  }
};

module.exports = {
  createSchedule,
  getUserSchedules,
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
  runScheduleNow,
  initializeSchedules
}; 