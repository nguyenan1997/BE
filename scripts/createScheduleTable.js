const { sequelize } = require('../config/database');
const { Schedule } = require('../models');

async function createScheduleTable() {
  try {
    console.log('🔄 Creating schedules table...');
    
    // Sync model Schedule
    await Schedule.sync({ force: true });
    
    console.log('✅ Table schedules created successfully!');
    console.log('📋 Table structure:');
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
    
    console.log('\n🎯 You can start using the schedule API!');
    console.log('📚 See documentation at: SCHEDULE_API_DOCS.md');
    
  } catch (error) {
    console.error('❌ Error creating schedules table:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  createScheduleTable();
}

module.exports = createScheduleTable; 