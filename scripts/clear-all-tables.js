const { sequelize } = require('../config/database');

// The order of table deletion must ensure no foreign key violations
const tables = [
  'youtube_history_logs',
  'video_statistics',
  'videos',
  'channel_statistics',
  'channel_violations',
  'google_access_tokens',
  'user_schedules',
  'user_channel',
  'youtube_channels',
  'users'
];

async function clearAllTables() {
  try {
    console.log('🚨 Starting to delete all data from tables...');
    for (const table of tables) {
      await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
      console.log(`✅ All data deleted from table: ${table}`);
    }
    // Re-enable foreign key checks
    // await sequelize.query('SET session_replication_role = DEFAULT;');
    console.log('🎉 All table data has been cleaned!');
  } catch (error) {
    console.error('❌ Error while deleting tables:', error);
  } finally {
    await sequelize.close();
  }
}

clearAllTables(); 