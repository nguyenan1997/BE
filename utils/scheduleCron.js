const cron = require('node-cron');
const { getSchedulesToRun, executeUserSchedule } = require('../services/scheduleService');
const { Op } = require('sequelize');
const { YoutubeHistoryLogs } = require('../models');

function initializeScheduleCron() {
  console.log('⏰ Initializing schedule cron job...');
  cron.schedule('* * * * *', async () => {
    try {
      const schedulesToRun = await getSchedulesToRun();
      if (schedulesToRun.length === 0) {
        // console.log('📅 No schedules to run');
        return;
      }
      console.log(`📅 Found ${schedulesToRun.length} schedules to run`);
      for (const schedule of schedulesToRun) {
        try {
          console.log(`🔄 Executing schedule for user ${schedule.user_id} at ${schedule.time_of_day}`);
          await executeUserSchedule(schedule);
        } catch (error) {
          console.error(`❌ Error executing schedule ${schedule.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in schedule cron job:', error);
    }
  });
  console.log('✅ Schedule cron job initialized');
}

async function cleanupHistoryLogs() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const deleted = await YoutubeHistoryLogs.destroy({
    where: {
      createdAt: { [Op.lt]: cutoff }
    }
  });
  if (deleted > 0) {
    console.log(`🧹 Đã xóa ${deleted} bản ghi lịch sử đồng bộ cũ hơn 30 ngày.`);
  } else {
    console.log('🧹 Không có bản ghi lịch sử đồng bộ nào cần xóa.');
  }
}

module.exports = {
  initializeScheduleCron,
  cleanupHistoryLogs
}; 