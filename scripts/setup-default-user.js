const { sequelize } = require('../config/database');
const { User, YouTubeChannel } = require('../models');
const bcrypt = require('bcryptjs');

async function setupDefaultUser() {
  try {
    console.log('🔄 Kiểm tra và tạo user mặc định...');
    
    // Kiểm tra xem có user nào không
    const userCount = await User.count();
    
    if (userCount === 0) {
      console.log('⚠️  Không có user nào, tạo user admin mặc định...');
      
      const defaultUser = await User.create({
        username: 'admin',
        email: 'admin@gmail.com',
        password: 'admin123456',
        fullName: 'System Administrator',
        role: 'admin',
        isActive: true
      });
      
      console.log(`✅ Đã tạo user admin: ${defaultUser.username}`);
      console.log(`📧 Email: ${defaultUser.email}`);
      console.log(`🔑 Password: admin123456`);
      console.log('⚠️  Vui lòng đổi password sau khi đăng nhập!');
      
      return defaultUser;
    } else {
      // Lấy user admin đầu tiên
      const adminUser = await User.findOne({
        where: { role: 'admin' },
        order: [['createdAt', 'ASC']]
      });
      
      if (adminUser) {
        console.log(`✅ Tìm thấy user admin: ${adminUser.username}`);
        return adminUser;
      } else {
        // Lấy user đầu tiên
        const firstUser = await User.findOne({
          order: [['createdAt', 'ASC']]
        });
        
        console.log(`✅ Sử dụng user đầu tiên: ${firstUser.username}`);
        return firstUser;
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình setup default user:', error);
    throw error;
  }
}

async function assignChannelsToUser(userId) {
  try {
    console.log(`🔄 Gán channels cho user ${userId}...`);
    
    // Đếm channels chưa có userId
    const channelsWithoutOwner = await YouTubeChannel.count({
      where: { userId: null }
    });
    
    if (channelsWithoutOwner === 0) {
      console.log('✅ Tất cả channels đã có owner');
      return;
    }
    
    console.log(`📊 Tìm thấy ${channelsWithoutOwner} channels chưa có owner`);
    
    // Update tất cả channels chưa có userId
    await YouTubeChannel.update(
      { userId: userId },
      { 
        where: { 
          userId: null 
        } 
      }
    );
    
    console.log(`✅ Đã gán ${channelsWithoutOwner} channels cho user`);
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình gán channels:', error);
    throw error;
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Bắt đầu setup database...');
    
    // Sync database
    await sequelize.sync({ alter: true });
    console.log('✅ Database đã được sync');
    
    // Setup default user
    const defaultUser = await setupDefaultUser();
    
    // Gán channels cho user
    await assignChannelsToUser(defaultUser.id);
    
    console.log('🎉 Setup database hoàn thành!');
    
    return {
      success: true,
      defaultUser: {
        id: defaultUser.id,
        username: defaultUser.username,
        email: defaultUser.email,
        role: defaultUser.role
      }
    };
    
  } catch (error) {
    console.error('❌ Setup database thất bại:', error);
    throw error;
  }
}

// Chạy setup nếu file được execute trực tiếp
if (require.main === module) {
  setupDatabase()
    .then((result) => {
      console.log('\n🎉 Setup completed successfully!');
      console.log(`👤 Default user: ${result.defaultUser.username}`);
      console.log(`📧 Email: ${result.defaultUser.email}`);
      console.log(`🔑 Role: ${result.defaultUser.role}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase, setupDefaultUser, assignChannelsToUser }; 