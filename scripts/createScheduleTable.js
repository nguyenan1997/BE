const { sequelize } = require('../config/database');
const { Schedule } = require('../models');

async function createScheduleTable() {
  try {
    console.log('🔄 Đang tạo bảng schedules...');
    
    // Sync model Schedule
    await Schedule.sync({ force: true });
    
    console.log('✅ Bảng schedules đã được tạo thành công!');
    console.log('📋 Cấu trúc bảng:');
    console.log('   - id: UUID (Primary Key)');
    console.log('   - userId: UUID (Foreign Key -> users.id)');
    console.log('   - channelId: UUID (Foreign Key -> youtube_channels.id)');
    console.log('   - name: STRING(200)');
    console.log('   - description: TEXT');
    console.log('   - cronExpression: STRING(100)');
    console.log('   - isActive: BOOLEAN (default: true)');
    console.log('   - lastRunAt: DATE');
    console.log('   - nextRunAt: DATE');
    console.log('   - runCount: INTEGER (default: 0)');
    console.log('   - maxRuns: INTEGER');
    console.log('   - settings: JSON');
    console.log('   - createdAt: DATE');
    console.log('   - updatedAt: DATE');
    
    console.log('\n🔗 Indexes:');
    console.log('   - userId');
    console.log('   - channelId');
    console.log('   - isActive');
    console.log('   - nextRunAt');
    
    console.log('\n🎯 Bạn có thể bắt đầu sử dụng API đặt lịch!');
    console.log('📚 Xem documentation tại: SCHEDULE_API_DOCS.md');
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo bảng schedules:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  createScheduleTable();
}

module.exports = createScheduleTable; 