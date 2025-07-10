const { sequelize } = require('../config/database');

// Thứ tự xoá bảng phải đảm bảo không vi phạm khoá ngoại
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
  'users',
  'companies'
];

async function clearAllTables() {
  try {
    console.log('🚨 Bắt đầu xoá toàn bộ dữ liệu các bảng...');
    for (const table of tables) {
      await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
      console.log(`✅ Đã xoá toàn bộ dữ liệu bảng: ${table}`);
    }
    // Bật lại kiểm tra khoá ngoại
    // await sequelize.query('SET session_replication_role = DEFAULT;');
    console.log('🎉 Đã xoá sạch toàn bộ dữ liệu các bảng!');
  } catch (error) {
    console.error('❌ Lỗi khi xoá bảng:', error);
  } finally {
    await sequelize.close();
  }
}

clearAllTables(); 