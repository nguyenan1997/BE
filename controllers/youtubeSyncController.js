const { syncYouTubeChannelData, syncRevenueData } = require('../services/youtubeSyncService');

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
    const isYoutube403 = error.message && error.message.includes('not eligible for analytics or monetization');
    res.status(isYoutube403 ? 403 : 500).json({
      success: false,
      message: error.message,
      error: error.stack
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

    // Lấy tất cả kênh của user qua UserChannel
    const UserChannel = require('../models/UserChannel');
    const { YouTubeChannel } = require('../models');
    const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
    const channelDbIds = links.map(link => link.channel_db_id);
    const channels = channelDbIds.length > 0 ? await YouTubeChannel.findAll({ where: { id: channelDbIds } }) : [];

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
    const isYoutube403 = error.message && error.message.includes('not eligible for analytics or monetization');
    res.status(isYoutube403 ? 403 : 500).json({
      success: false,
      message: error.message,
      error: error.stack
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
    const SharedChannel = require('../models/UserChannel');
    // Lấy danh sách channel_db_id của user
    const links = await SharedChannel.findAll({ where: { user_id: userId, is_active: true } });
    const channelDbIds = links.map(link => link.channel_db_id);

    // Thống kê dữ liệu
    const channelCount = channelDbIds.length;

    const videoCount = await Video.count({
      where: { channel_db_id: channelDbIds }
    });

    const latestChannelStats = await ChannelStatistics.findOne({
      where: { channel_db_id: channelDbIds },
      order: [['date', 'DESC']]
    });

    const latestVideoStats = await VideoStatistics.findOne({
      include: [{
        model: Video,
        as: 'video',
        where: { channel_db_id: channelDbIds }
      }],
      order: [['date', 'DESC']]
    });

    res.json({
      success: true,
      data: {
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
    const isYoutube403 = error.message && error.message.includes('not eligible for analytics or monetization');
    res.status(isYoutube403 ? 403 : 500).json({
      success: false,
      message: error.message,
      error: error.stack
    });
  }
};

/**
 * @swagger
 * /api/youtube-sync/refresh:
 *   post:
 *     summary: Manually refresh (re-sync) all YouTube channels for the current user
 *     tags: [YouTube Sync]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All channel data refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       channelId:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       result:
 *                         type: object
 *                       error:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No channels found for this user
 *       500:
 *         description: Internal server error
 */
const refreshAllChannelData = async (req, res) => {
  try {
    const userId = req.currentUser?.userId || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: userId missing' });
    }
    const UserChannel = require('../models/UserChannel');
    const { YouTubeChannel } = require('../models');
    const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
    if (!links.length) {
      return res.status(404).json({ success: false, message: 'No channels found for this user.' });
    }
    const syncYouTubeChannelData = require('../services/youtubeSyncService').syncYouTubeChannelData;
    const results = [];
    for (const link of links) {
      try {
        const channel = await YouTubeChannel.findOne({ where: { id: link.channel_db_id } });
        if (!channel) {
          results.push({ channelDbId: link.channel_db_id, channelId: null, success: false, error: 'Channel not found in database' });
          continue;
        }
        const result = await syncYouTubeChannelData({
          userId,
          channelId: channel.channel_id,
          channelDbId: channel.id
        });
        results.push({ channelDbId: link.channel_db_id, channelId: channel.channel_id, success: true, result });
      } catch (err) {
        let channel = null;
        try {
          channel = await YouTubeChannel.findOne({ where: { id: link.channel_db_id } });
        } catch (err) {
          console.error('Error finding channel:', err);
        }
        let errorMsg = err.message;
        if (
          errorMsg.includes('not eligible for analytics') ||
          errorMsg.includes('status code 403') ||
          errorMsg.includes('monetization')
        ) {
          errorMsg = 'This channel is not eligible for analytics or monetization.';
        }
        results.push({ channelDbId: link.channel_db_id, channelId: channel ? channel.channel_id : null, success: false, error: errorMsg });
      }
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, error: error.stack });
  }
};

module.exports = {
  syncRevenueDataForPeriod,
  syncAllUserChannelsRevenue,
  getSyncStatus,
  refreshAllChannelData
}; 