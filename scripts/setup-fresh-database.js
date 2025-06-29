const { sequelize } = require('../config/database');
const { User } = require('../models');

async function setupFreshDatabase() {
  try {
    console.log('🚀 Bắt đầu setup database mới từ đầu...');

    // 1. Sync tất cả models để tạo bảng
    console.log('\n1. Tạo tất cả bảng...');
    await sequelize.sync({ force: true });
    console.log('✅ Tất cả bảng đã được tạo thành công');

    // 2. Tạo tài khoản admin
    console.log('\n2. Tạo tài khoản admin...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@gmail.com',
      password: 'admin123456', // Sẽ được hash tự động
      fullName: 'System Administrator',
      role: 'admin'
    });
    console.log('✅ Tài khoản admin đã được tạo:', adminUser.email);

    // 3. Tạo tài khoản user demo
    console.log('\n3. Tạo tài khoản user demo...');
    const demoUser = await User.create({
      username: 'user1',
      email: 'user1@gmail.com',
      password: 'user123456', // Sẽ được hash tự động
      fullName: 'User 1',
      role: 'user'
    });
    console.log('✅ Tài khoản demo đã được tạo:', demoUser.email);
    console.log('Demo user UUID:', demoUser.id);

    console.log('\n🎉 Database setup hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi khi setup database:', error);
  } finally {
    await sequelize.close();
  }
}

setupFreshDatabase(); 