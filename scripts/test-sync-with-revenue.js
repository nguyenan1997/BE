require('dotenv').config();
const { syncYouTubeChannelData, syncRevenueData } = require('../services/youtubeSyncService');

// Demo script để test sync YouTube data với revenue
const testSyncWithRevenue = async () => {
  console.log('🎯 YouTube Sync with Revenue Test');
  console.log('==================================\n');

  try {
    // Test parameters
    const userId = process.argv[2] || '1';
    const channelId = process.argv[3] || 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Google Developers channel
    
    if (!userId || !channelId) {
      console.log('❌ Usage: node scripts/test-sync-with-revenue.js <userId> <channelId>');
      console.log('Example: node scripts/test-sync-with-revenue.js 1 UC_x5XG1OV2P6uZZ5FSM9Ttw');
      return;
    }

    console.log(`📊 Testing sync for:`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Channel ID: ${channelId}\n`);

    // Test 1: Sync toàn bộ channel data (bao gồm revenue)
    console.log('1️⃣ Syncing full channel data with revenue...');
    try {
      const result = await syncYouTubeChannelData({ userId, channelId });
      console.log('✅ Full sync successful!');
      console.log(`   Channel Revenue (30 days): $${result.channelRevenue || 'N/A'}`);
      console.log(`   Videos Processed: ${result.videosProcessed}`);
      console.log(`   Message: ${result.message}`);
    } catch (error) {
      console.log('❌ Full sync failed:', error.message);
      
      if (error.message.includes('No active YouTube authorization')) {
        console.log('💡 User needs to authorize with YouTube first');
        console.log('   Run: npm run test-youtube-oauth');
      }
    }

    console.log('\n2️⃣ Testing revenue sync for specific period...');
    try {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      
      const revenueResult = await syncRevenueData({
        userId,
        channelId,
        startDate,
        endDate
      });
      
      console.log('✅ Revenue sync successful!');
      console.log(`   Results: ${revenueResult.results.join(', ')}`);
    } catch (error) {
      console.log('❌ Revenue sync failed:', error.message);
    }

    console.log('\n3️⃣ Testing video revenue sync...');
    try {
      // Lấy video ID từ database (nếu có)
      const { Video } = require('../models');
      const video = await Video.findOne({
        include: [{
          model: require('../models').YouTubeChannel,
          as: 'youtube_channel',
          where: { user_id: userId }
        }],
        limit: 1
      });

      if (video) {
        const startDate = '2024-01-01';
        const endDate = '2024-01-31';
        
        const videoRevenueResult = await syncRevenueData({
          userId,
          videoId: video.video_id,
          startDate,
          endDate
        });
        
        console.log('✅ Video revenue sync successful!');
        console.log(`   Video ID: ${video.video_id}`);
        console.log(`   Video Title: ${video.title}`);
        console.log(`   Results: ${videoRevenueResult.results.join(', ')}`);
      } else {
        console.log('ℹ️  No videos found in database');
      }
    } catch (error) {
      console.log('❌ Video revenue sync failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Check environment
const checkEnvironment = () => {
  console.log('🔍 Environment Check');
  console.log('===================');
  
  const requiredVars = [
    'YOUTUBE_CLIENT_ID',
    'YOUTUBE_CLIENT_SECRET',
    'YOUTUBE_REDIRECT_URI'
  ];

  let allSet = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Not set`);
      allSet = false;
    }
  });

  console.log('');
  return allSet;
};

// Main execution
const main = async () => {
  if (!checkEnvironment()) {
    console.log('⚠️  Please set all required environment variables before running this test.');
    console.log('   Copy from env.example to .env and fill in your YouTube API credentials.');
    return;
  }

  await testSyncWithRevenue();
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testSyncWithRevenue, checkEnvironment }; 