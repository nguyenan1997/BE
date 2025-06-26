const { Schedule, YouTubeChannel } = require('../models');
const cron = require('node-cron');

// Save all active jobs
const activeJobs = new Map();

// Create a new schedule
const createSchedule = async (req, res) => {
  try {
    const { channelId, name, description, cronExpression, maxRuns, settings } = req.body;
    const userId = req.user.userId;

    // Check if channel exists and belongs to user
    const channel = await YouTubeChannel.findOne({
      where: { id: channelId, userId: userId }
    });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'YouTube channel does not exist or does not belong to you'
      });
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cron expression'
      });
    }

    // Calculate next run time
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

    // Create cron job if schedule is active
    if (schedule.isActive) {
      createCronJob(schedule);
    }

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule
    });

  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user schedules
const getUserSchedules = async (req, res) => {
  try {
    const userId = req.user.userId;
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
      message: 'Server error',
      error: error.message
    });
  }
};

// Update schedule
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updateData = req.body;

    const schedule = await Schedule.findOne({
      where: { id, userId }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule does not exist'
      });
    }

    // Validate cron expression if updated
    if (updateData.cronExpression && !cron.validate(updateData.cronExpression)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cron expression'
      });
    }

    // Update next run time if cron expression changes
    if (updateData.cronExpression) {
      updateData.nextRunAt = cron.getNextDate(updateData.cronExpression);
    }

    await schedule.update(updateData);

    // Update cron job
    updateCronJob(schedule);

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });

  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete schedule
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const schedule = await Schedule.findOne({
      where: { id, userId }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule does not exist'
      });
    }

    // Stop cron job if running
    stopCronJob(schedule.id);

    await schedule.destroy();

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Toggle schedule
const toggleSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const schedule = await Schedule.findOne({
      where: { id, userId }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule does not exist'
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
      message: `Schedule ${schedule.isActive ? 'enabled' : 'disabled'}`,
      data: schedule
    });

  } catch (error) {
    console.error('Error toggling schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Run schedule immediately
const runScheduleNow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

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
        message: 'Schedule does not exist'
      });
    }

    // Run analysis immediately
    await executeSchedule(schedule);

    res.json({
      success: true,
      message: 'Schedule run successfully'
    });

  } catch (error) {
    console.error('Error running schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create cron job for schedule
const createCronJob = (schedule) => {
  // Stop old job if exists
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

// Update cron job
const updateCronJob = (schedule) => {
  if (schedule.isActive) {
    createCronJob(schedule);
  } else {
    stopCronJob(schedule.id);
  }
};

// Stop cron job
const stopCronJob = (scheduleId) => {
  const job = activeJobs.get(scheduleId);
  if (job) {
    job.stop();
    activeJobs.delete(scheduleId);
  }
};

// Execute schedule
const executeSchedule = async (schedule) => {
  try {
    // Check maximum runs
    if (schedule.maxRuns && schedule.runCount >= schedule.maxRuns) {
      await schedule.update({ isActive: false });
      stopCronJob(schedule.id);
      return;
    }

    // Import controller to run analysis
    const { fetchAndAnalyze } = require('./youtubeController');
    
    // Create mock request object with updated structure
    const mockReq = {
      user: { userId: schedule.userId },
      body: { channelId: schedule.channelId }
    };

    // Create mock response object
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`Schedule ${schedule.id} executed with status ${code}:`, data);
        }
      })
    };

    // Run analysis
    await fetchAndAnalyze(mockReq, mockRes);

    // Update schedule information
    await schedule.update({
      lastRunAt: new Date(),
      runCount: schedule.runCount + 1,
      nextRunAt: cron.getNextDate(schedule.cronExpression)
    });

  } catch (error) {
    console.error(`Error executing schedule ${schedule.id}:`, error);
    
    // Update schedule information
    await schedule.update({
      lastRunAt: new Date(),
      runCount: schedule.runCount + 1
    });
  }
};

// Initialize cron jobs when server starts
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