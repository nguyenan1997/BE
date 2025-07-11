const UserSchedule = require('../models/UserSchedule');
const { User, UserChannel, YouTubeChannel } = require('../models');
const { syncYouTubeChannelData } = require('./youtubeSyncService');

/**
 * Create or update user schedule
 * @param {string} userId
 * @param {Object} scheduleData
 * @param {string} scheduleData.time_of_day
 * @param {string} scheduleData.start_date
 * @param {boolean} scheduleData.is_active
 */
async function createOrUpdateSchedule(userId, scheduleData) {
  try {
    const { time_of_day, start_date, is_active = true } = scheduleData;

    // Calculate next run time based on time_of_day and start_date
    const nextRunAt = calculateNextRun(time_of_day, start_date);

    // Test if user exists
    const existingSchedule = await UserSchedule.findOne({
      where: { user_id: userId }
    });

    if (existingSchedule) {
      // Update existing schedule
      await existingSchedule.update({
        time_of_day,
        start_date,
        is_active,
        next_run_at: nextRunAt
      });
      return existingSchedule;
    } else {
      // Create new schedule
      const newSchedule = await UserSchedule.create({
        user_id: userId,
        time_of_day,
        start_date,
        is_active,
        next_run_at: nextRunAt
      });
      return newSchedule;
    }
  } catch (error) {
    console.error('Error creating/updating schedule:', error);
    throw error;
  }
}

/**
 * Get user schedule by user ID
 * @param {string} userId
 */
async function getUserSchedule(userId) {
  try {
    const schedule = await UserSchedule.findOne({
      where: { user_id: userId }
    });
    return schedule;
  } catch (error) {
    console.error('Error getting user schedule:', error);
    throw error;
  }
}

/**
 * Toggle schedule active status for a user
 * @param {string} userId
 * @param {boolean} isActive
 */
async function toggleSchedule(userId, isActive) {
  try {
    const schedule = await UserSchedule.findOne({
      where: { user_id: userId }
    });

    if (!schedule) {
      throw new Error('User does not have a schedule');
    }

    await schedule.update({ is_active: isActive });
    return schedule;
  } catch (error) {
    console.error('Error toggling schedule:', error);
    throw error;
  }
}

/**
 * Delete user schedule
 * @param {string} userId
 */
async function deleteSchedule(userId) {
  try {
    const schedule = await UserSchedule.findOne({
      where: { user_id: userId }
    });

    if (!schedule) {
      throw new Error('User does not have a schedule');
    }

    await schedule.destroy();
    return { success: true, message: 'Schedule deleted successfully' };
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
}

/**
 * Calculate the next run time
 * @param {string} timeOfDay - Run time (HH:MM:SS)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 */
function calculateNextRun(timeOfDay, startDate) {
  const now = new Date();
  const [hours, minutes, seconds] = timeOfDay.split(':').map(Number);
  
  // Create today's run time
  const todayRun = new Date();
  todayRun.setHours(hours, minutes, seconds, 0);
  
  // If the time has passed today, move to tomorrow
  if (todayRun <= now) {
    todayRun.setDate(todayRun.getDate() + 1);
  }
  
  console.log(`⏰ Current time: ${now.toISOString()}`);
  console.log(`⏰ Next run time: ${todayRun.toISOString()}`);
  
  return todayRun;
}

/**
 * Execute schedule for user
 * @param {Object} schedule - Schedule to execute
 */
async function executeUserSchedule(schedule) {
  const { user_id, id: scheduleId } = schedule;
  
  console.log(`🔄 Executing schedule ${scheduleId} for user ${user_id}`);
  
  try {
    // 1. Lấy tất cả channels của user
    const userChannels = await UserChannel.findAll({
      where: { 
        user_id,
        is_active: true 
      },
      include: [{
        model: YouTubeChannel,
        as: 'youtube_channel'
      }]
    });

    console.log(`📺 Found ${userChannels.length} channels to sync for user ${user_id}`);

    if (userChannels.length === 0) {
      console.log(`⚠️ No channels found for user ${user_id}`);
      // Vẫn cập nhật lịch để tính next_run_at
      await updateScheduleAfterRun(schedule);
      return;
    }

    // 2. Sync từng channel
    const results = [];
    for (const userChannel of userChannels) {
      try {
        await syncYouTubeChannelData({
          userId: user_id,
          channelId: userChannel.youtube_channel.channel_id,
          channelDbId: userChannel.channel_db_id
        });
        results.push({ 
          channel: userChannel.youtube_channel.channel_title, 
          success: true 
        });
      } catch (error) {
        console.error(`❌ Error syncing channel ${userChannel.youtube_channel.channel_title}:`, error);
        results.push({ 
          channel: userChannel.youtube_channel.channel_title, 
          success: false, 
          error: error.message 
        });
      }
    }

    // 3. Cập nhật lịch
    await updateScheduleAfterRun(schedule);

    // 4. Log kết quả
    const successfulSyncs = results.filter(r => r.success).length;
    const failedSyncs = results.filter(r => !r.success).length;
    
    console.log(`✅ Schedule ${scheduleId} completed: ${successfulSyncs} successful, ${failedSyncs} failed`);
    
    // TODO: Có thể thêm gửi thông báo cho user ở đây
    
  } catch (error) {
    console.error(`❌ Error executing schedule ${scheduleId}:`, error);
    throw error;
  }
}

/**
 * Update schedule after run
 * @param {Object} schedule - Schedule to update
 */
async function updateScheduleAfterRun(schedule) {
  const nextRunAt = calculateNextRun(schedule.time_of_day, schedule.start_date);
  
  await schedule.update({
    last_run_at: new Date(),
    next_run_at: nextRunAt,
    run_count: schedule.run_count + 1
  });
}

/**
 * Get all schedules to run
 */
async function getSchedulesToRun() {
  try {
    const schedules = await UserSchedule.findAll({
      where: {
        is_active: true,
        next_run_at: {
          [require('sequelize').Op.lte]: new Date() // next_run_at <= now
        }
      },
      include: [{
        model: User,
        as: 'user'
      }]
    });
    
    return schedules;
  } catch (error) {
    console.error('Error getting schedules to run:', error);
    throw error;
  }
}

/**
 * Create new schedule for user
 * @param {string} userId - User ID
 * @param {Object} scheduleData - Schedule data
 */
async function createSchedule(userId, scheduleData) {
  try {
    const { time_of_day, start_date, is_active = true } = scheduleData;
    const nextRunAt = calculateNextRun(time_of_day, start_date);
    const newSchedule = await UserSchedule.create({
      user_id: userId,
      time_of_day,
      start_date,
      is_active,
      next_run_at: nextRunAt
    });
    return newSchedule;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
}

/**
 * Get all schedules of user
 * @param {string} userId - User ID
 */
async function getUserSchedules(userId) {
  try {
    const schedules = await UserSchedule.findAll({
      where: { user_id: userId }
    });
    return schedules;
  } catch (error) {
    console.error('Error getting user schedules:', error);
    throw error;
  }
}

/**
 * Toggle specific schedule
 * @param {string} scheduleId - Schedule ID
 * @param {boolean} isActive - Active status
 */
async function toggleSchedule(scheduleId, isActive) {
  try {
    const schedule = await UserSchedule.findByPk(scheduleId);
    if (!schedule) throw new Error('Schedule not found');
    await schedule.update({ is_active: isActive });
    return schedule;
  } catch (error) {
    console.error('Error toggling schedule:', error);
    throw error;
  }
}

/**
 * Delete specific schedule
 * @param {string} scheduleId - Schedule ID
 */
async function deleteSchedule(scheduleId) {
  try {
    const schedule = await UserSchedule.findByPk(scheduleId);
    if (!schedule) throw new Error('Schedule not found');
    await schedule.destroy();
    return { success: true, message: 'Schedule deleted successfully' };
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
}

/**
 * Update a specific schedule
 * @param {string} scheduleId - Schedule ID
 * @param {Object} updateData - Data to update
 */
async function updateSchedule(scheduleId, updateData) {
  try {
    const schedule = await UserSchedule.findByPk(scheduleId);
    if (!schedule) throw new Error('Schedule not found');
    // Nếu có time_of_day hoặc start_date thì tính lại next_run_at
    let nextRunAt = schedule.next_run_at;
    if (updateData.time_of_day || updateData.start_date) {
      const time = updateData.time_of_day || schedule.time_of_day;
      const date = updateData.start_date || schedule.start_date;
      nextRunAt = calculateNextRun(time, date);
      updateData.next_run_at = nextRunAt;
    }
    await schedule.update(updateData);
    return schedule;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
}

module.exports = {
  createOrUpdateSchedule,
  getUserSchedule,
  toggleSchedule,
  deleteSchedule,
  executeUserSchedule,
  getSchedulesToRun,
  calculateNextRun,
  createSchedule,
  getUserSchedules,
  updateSchedule
}; 