const cron = require('node-cron');
const { getSchedulesToRun, executeUserSchedule } = require('../services/scheduleService');

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

module.exports = {
  initializeScheduleCron
}; 