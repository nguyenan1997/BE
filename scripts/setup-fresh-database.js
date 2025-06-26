const { sequelize } = require('../config/database');
const {
  User,
  YouTubeChannel,
  ChannelStatistics,
  ChannelVideo,
  ChannelSocialLink,
  ChannelAnalysis
} = require('../models');

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
      email: 'admin@youtube-manager.com',
      password: 'admin123456', // Sẽ được hash tự động
      fullName: 'System Administrator',
      role: 'admin',
      isActive: true
    });
    console.log('✅ Tài khoản admin đã được tạo:');
    console.log(`   👤 Username: ${adminUser.username}`);
    console.log(`   📧 Email: ${adminUser.email}`);
    console.log(`   🔑 Password: admin123456`);
    console.log(`   👑 Role: ${adminUser.role}`);
    console.log('⚠️  Vui lòng đổi password sau khi đăng nhập!');
    
    // 3. Tạo tài khoản user demo
    console.log('\n3. Tạo tài khoản user demo...');
    const demoUser = await User.create({
      username: 'demo',
      email: 'demo@youtube-manager.com',
      password: 'demo123456',
      fullName: 'Demo User',
      role: 'user',
      isActive: true
    });
    console.log('✅ Tài khoản demo đã được tạo:');
    console.log(`   👤 Username: ${demoUser.username}`);
    console.log(`   📧 Email: ${demoUser.email}`);
    console.log(`   🔑 Password: demo123456`);
    console.log(`   👤 Role: ${demoUser.role}`);
    
    // 4. Tạo channel demo để test
    console.log('\n4. Tạo channel demo để test...');
    const demoChannel = await YouTubeChannel.create({
      userId: demoUser.id,
      channelName: 'Demo Tech Channel',
      description: 'A demo channel for testing the new database structure',
      category: 'Technology',
      joinDate: '2020-01-01',
      location: 'United States',
      imageUrl: 'https://example.com/demo-channel.jpg',
      analysisStatus: 'completed',
      analyzedBy: adminUser.id
    });
    console.log('✅ Channel demo đã được tạo:', demoChannel.channelName);
    
    // 5. Tạo thống kê demo
    console.log('\n5. Tạo thống kê demo...');
    await ChannelStatistics.create({
      channelId: demoChannel.id,
      subscriberCount: '500K',
      totalViews: '10M',
      estimatedRevenue: '$2K/month',
      watchTime: '100K hours',
      views48h: '50K',
      views60min: '5K',
      recordedAt: new Date()
    });
    console.log('✅ Thống kê demo đã được tạo');
    
    // 6. Tạo video demo
    console.log('\n6. Tạo video demo...');
    await ChannelVideo.create({
      channelId: demoChannel.id,
      videoId: 'demo_video_001',
      title: 'How to Build a Web App',
      description: 'Learn how to build a modern web application',
      thumbnailUrl: 'https://example.com/thumbnail1.jpg',
      publishedAt: new Date('2024-01-15'),
      duration: '15:30',
      viewCount: 100000,
      likeCount: 5000,
      commentCount: 800,
      isRecent: true,
      recordedAt: new Date()
    });
    
    await ChannelVideo.create({
      channelId: demoChannel.id,
      videoId: 'demo_video_002',
      title: 'Database Design Best Practices',
      description: 'Learn the best practices for database design',
      thumbnailUrl: 'https://example.com/thumbnail2.jpg',
      publishedAt: new Date('2024-01-10'),
      duration: '12:45',
      viewCount: 75000,
      likeCount: 3500,
      commentCount: 600,
      isRecent: true,
      recordedAt: new Date()
    });
    console.log('✅ Videos demo đã được tạo');
    
    // 7. Tạo social links demo
    console.log('\n7. Tạo social links demo...');
    await ChannelSocialLink.create({
      channelId: demoChannel.id,
      platform: 'facebook',
      url: 'https://facebook.com/demotechchannel',
      displayName: 'Demo Tech Channel',
      isActive: true
    });
    
    await ChannelSocialLink.create({
      channelId: demoChannel.id,
      platform: 'twitter',
      url: 'https://twitter.com/demotechchannel',
      displayName: '@demotechchannel',
      isActive: true
    });
    
    await ChannelSocialLink.create({
      channelId: demoChannel.id,
      platform: 'instagram',
      url: 'https://instagram.com/demotechchannel',
      displayName: 'demotechchannel',
      isActive: true
    });
    console.log('✅ Social links demo đã được tạo');
    
    // 8. Tạo phân tích AI demo
    console.log('\n8. Tạo phân tích AI demo...');
    await ChannelAnalysis.create({
      channelId: demoChannel.id,
      analysisType: 'content_analysis',
      analysisData: {
        contentQuality: 'high',
        engagementRate: '6.8%',
        audienceDemographics: {
          age: '18-34',
          location: 'US, UK, Canada',
          interests: ['Technology', 'Programming', 'Web Development']
        },
        contentThemes: ['Web Development', 'Programming', 'Tech Reviews'],
        uploadFrequency: '2 videos/week',
        averageVideoLength: '12 minutes'
      },
      summary: 'This is a high-quality technology channel with excellent engagement rates and consistent content delivery.',
      confidence: 0.92,
      analyzedAt: new Date(),
      isLatest: true
    });
    console.log('✅ Phân tích AI demo đã được tạo');
    
    // 9. Test relationships
    console.log('\n9. Testing relationships...');
    const channelWithData = await YouTubeChannel.findOne({
      where: { id: demoChannel.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username', 'fullName', 'role']
        },
        {
          model: ChannelStatistics,
          as: 'statistics',
          order: [['recordedAt', 'DESC']],
          limit: 1
        },
        {
          model: ChannelVideo,
          as: 'videos',
          where: { isRecent: true }
        },
        {
          model: ChannelSocialLink,
          as: 'socialLinks',
          where: { isActive: true }
        },
        {
          model: ChannelAnalysis,
          as: 'analyses',
          where: { isLatest: true }
        }
      ]
    });
    
    console.log('✅ Relationships test thành công!');
    console.log('📊 Dữ liệu demo:');
    console.log(`   - Channel: ${channelWithData.channelName}`);
    console.log(`   - Owner: ${channelWithData.user.username} (${channelWithData.user.role})`);
    console.log(`   - Statistics: ${channelWithData.statistics.length} record`);
    console.log(`   - Videos: ${channelWithData.videos.length} recent videos`);
    console.log(`   - Social Links: ${channelWithData.socialLinks.length} active links`);
    console.log(`   - AI Analysis: ${channelWithData.analyses.length} latest analysis`);
    
    // 10. Hiển thị thông tin đăng nhập
    console.log('\n🎉 Setup hoàn thành thành công!');
    console.log('\n📋 THÔNG TIN ĐĂNG NHẬP:');
    console.log('=====================================');
    console.log('👑 ADMIN ACCOUNT:');
    console.log(`   Username: admin`);
    console.log(`   Email: admin@youtube-manager.com`);
    console.log(`   Password: admin123456`);
    console.log(`   Role: admin`);
    console.log('');
    console.log('👤 DEMO USER ACCOUNT:');
    console.log(`   Username: demo`);
    console.log(`   Email: demo@youtube-manager.com`);
    console.log(`   Password: demo123456`);
    console.log(`   Role: user`);
    console.log('=====================================');
    console.log('\n⚠️  LƯU Ý: Vui lòng đổi password sau khi đăng nhập!');
    console.log('\n🚀 Bạn có thể bắt đầu sử dụng hệ thống ngay bây giờ!');
    
    return {
      success: true,
      adminUser: {
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      },
      demoUser: {
        username: demoUser.username,
        email: demoUser.email,
        role: demoUser.role
      },
      demoChannel: {
        id: demoChannel.id,
        name: demoChannel.channelName
      }
    };
    
  } catch (error) {
    console.error('❌ Setup database thất bại:', error);
    throw error;
  }
}

// Chạy setup nếu file được execute trực tiếp
if (require.main === module) {
  setupFreshDatabase()
    .then((result) => {
      console.log('\n✅ Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupFreshDatabase }; 