const { sequelize } = require('../config/database');
const {
  User,
  YouTubeChannel,
  ChannelStatistics,
  ChannelViolation,
  Video,
  VideoStatistics,
  AccessToken,
  UserSchedule
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
      email: 'admin@gmail.com',
      password_hash: 'admin123456', // Nên hash khi thực tế
      full_name: 'System Administrator'
    });
    console.log('✅ Tài khoản admin đã được tạo:', adminUser.email);

    // 3. Tạo tài khoản user demo
    console.log('\n3. Tạo tài khoản user demo...');
    const demoUser = await User.create({
      email: 'user1@gmail.com',
      password_hash: 'user123456',
      full_name: 'User 1'
    });
    console.log('✅ Tài khoản demo đã được tạo:', demoUser.email);

    // 4. Tạo user_schedule cho demo user
    await UserSchedule.create({
      user_id: demoUser.id,
      time_of_day: '08:00:00',
      is_active: true
    });
    console.log('✅ User schedule đã được tạo');

    // 5. Tạo channel demo
    const demoChannel = await YouTubeChannel.create({
      user_id: demoUser.id,
      channel_id: 'UC1234567890',
      channel_title: 'Demo Tech Channel',
      channel_description: 'A demo channel for testing the new database structure',
      channel_custom_url: 'demotech',
      channel_country: 'US',
      channel_thumbnail_url: 'https://example.com/demo-channel.jpg',
      channel_creation_date: new Date('2020-01-01'),
      is_verified: true,
      is_monitized: true
    });
    console.log('✅ Channel demo đã được tạo:', demoChannel.channel_title);

    // 6. Tạo access token demo
    await AccessToken.create({
      user_id: demoUser.id,
      channel_id: demoChannel.id,
      access_token: 'ya29.a0AfH6SMBEXAMPLE',
      refresh_token: '1//0gEXAMPLE',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      expires_at: new Date(Date.now() + 3600 * 1000)
    });
    console.log('✅ Access token demo đã được tạo');

    // 7. Tạo thống kê channel demo
    await ChannelStatistics.create({
      channel_id: demoChannel.id,
      date: new Date('2024-06-01'),
      subscriber_count: 500000,
      view_count: 10000000,
      like_count: 250000,
      comment_count: 12000,
      share_count: 3000,
      watch_time_minutes: 100000,
      estimated_revenue: 2000.5,
      view_growth_percent: 2.5,
      subscriber_growth_percent: 1.2
    });
    console.log('✅ Channel statistics demo đã được tạo');

    // 8. Tạo cảnh báo vi phạm demo
    await ChannelViolation.create({
      channel_id: demoChannel.id,
      violation_type: 'community',
      title: 'Community Guidelines Violation',
      description: 'Vi phạm nguyên tắc cộng đồng do nội dung không phù hợp.',
      status: 'active',
      violation_date: new Date('2024-05-20'),
      resolved_date: null
    });
    console.log('✅ Channel violation demo đã được tạo');

    // 9. Tạo video demo
    const demoVideo = await Video.create({
      channel_id: demoChannel.id,
      video_id: 'demo_video_001',
      title: 'How to Build a Web App',
      description: 'Learn how to build a modern web application',
      published_at: new Date('2024-01-15'),
      thumbnail_url: 'https://example.com/thumbnail1.jpg',
      duration: '15:30',
      privacy_status: 'public'
    });
    console.log('✅ Video demo đã được tạo:', demoVideo.title);

    // 10. Tạo video statistics demo
    await VideoStatistics.create({
      video_id: demoVideo.id,
      date: new Date('2024-06-01'),
      view_count: 100000,
      like_count: 5000,
      comment_count: 800,
      share_count: 200,
      estimated_revenue: 120.5
    });
    console.log('✅ Video statistics demo đã được tạo');

    console.log('\n🎉 Database setup hoàn tất!');
  } catch (error) {
    console.error('❌ Lỗi khi setup database:', error);
  } finally {
    await sequelize.close();
  }
}

setupFreshDatabase(); 