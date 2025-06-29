const { syncYouTubeChannelData, syncRevenueData } = require('../services/youtubeSyncService');

// Sync toàn bộ dữ liệu kênh (bao gồm revenue)
const syncChannelData = async (req, res) => {
  try {
    const { userId, channelId } = req.body;
    
    if (!userId || !channelId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Channel ID are required'
      });
    }

    const result = await syncYouTubeChannelData({ userId, channelId });
    
    res.json({
      success: true,
      data: result,
      message: 'Channel data synced successfully'
    });
    
  } catch (error) {
    console.error('Error syncing channel data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync channel data',
      error: error.message
    });
  }
};

// Sync revenue data cho kênh/video cụ thể
const syncRevenueDataForPeriod = async (req, res) => {
  try {
    const { userId, channelId, videoId, startDate, endDate } = req.body;
    
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'User ID, start date, and end date are required'
      });
    }

    if (!channelId && !videoId) {
      return res.status(400).json({
        success: false,
        message: 'Either Channel ID or Video ID is required'
      });
    }

    const result = await syncRevenueData({ 
      userId, 
      channelId, 
      videoId, 
      startDate, 
      endDate 
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Revenue data synced successfully'
    });
    
  } catch (error) {
    console.error('Error syncing revenue data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync revenue data',
      error: error.message
    });
  }
};

// Sync revenue data cho tất cả kênh của user
const syncAllUserChannelsRevenue = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.body;
    
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'User ID, start date, and end date are required'
      });
    }

    // Lấy tất cả kênh của user
    const { YouTubeChannel } = require('../models');
    const channels = await YouTubeChannel.findAll({
      where: { user_id: userId }
    });

    if (channels.length === 0) {
      return res.json({
        success: true,
        message: 'No channels found for user',
        data: { channelsProcessed: 0 }
      });
    }

    const results = [];
    for (const channel of channels) {
      try {
        const result = await syncRevenueData({
          userId,
          channelId: channel.channel_id,
          startDate,
          endDate
        });
        results.push({
          channelId: channel.channel_id,
          channelTitle: channel.channel_title,
          success: true,
          result: result.results
        });
      } catch (error) {
        results.push({
          channelId: channel.channel_id,
          channelTitle: channel.channel_title,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      data: {
        totalChannels: channels.length,
        successCount: successCount,
        failedCount: channels.length - successCount,
        results: results
      },
      message: `Revenue data synced for ${successCount}/${channels.length} channels`
    });
    
  } catch (error) {
    console.error('Error syncing all channels revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync all channels revenue',
      error: error.message
    });
  }
};

// Get sync status và thống kê
const getSyncStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const { YouTubeChannel, ChannelStatistics, Video, VideoStatistics, AccessToken } = require('../models');
    
    // Kiểm tra authorization status
    const tokenRecord = await AccessToken.findOne({
      where: { user_id: req.user.id, is_active: true, channel_db_id: channelDbId }
    });

    const authStatus = {
      isAuthorized: !!tokenRecord,
      hasAnalyticsAccess: tokenRecord ? tokenRecord.scope.includes('yt-analytics-monetary.readonly') : false,
      tokenExpiresAt: tokenRecord ? tokenRecord.expiresAt : null,
      isExpired: tokenRecord ? (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) : true
    };

    // Thống kê dữ liệu
    const channelCount = await YouTubeChannel.count({
      where: { user_id: userId }
    });

    const videoCount = await Video.count({
      include: [{
        model: YouTubeChannel,
        as: 'youtube_channel',
        where: { user_id: userId }
      }]
    });

    const latestChannelStats = await ChannelStatistics.findOne({
      include: [{
        model: YouTubeChannel,
        as: 'youtube_channel',
        where: { user_id: userId }
      }],
      order: [['date', 'DESC']]
    });

    const latestVideoStats = await VideoStatistics.findOne({
      include: [{
        model: Video,
        as: 'video',
        include: [{
          model: YouTubeChannel,
          as: 'youtube_channel',
          where: { user_id: userId }
        }]
      }],
      order: [['date', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        authStatus: authStatus,
        channels: {
          total: channelCount,
          lastSync: latestChannelStats ? latestChannelStats.date : null,
          hasRevenueData: latestChannelStats ? latestChannelStats.estimated_revenue !== null : false
        },
        videos: {
          total: videoCount,
          lastSync: latestVideoStats ? latestVideoStats.date : null,
          hasRevenueData: latestVideoStats ? latestVideoStats.estimated_revenue !== null : false
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
};

module.exports = {
  syncChannelData,
  syncRevenueDataForPeriod,
  syncAllUserChannelsRevenue,
  getSyncStatus
}; 