const { createYouTubeAnalyticsClient, refreshAccessToken } = require('../config/youtube');
const { GoogleAccessToken } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { ChannelStatistics, VideoStatistics } = require('../models');

// Get channel revenue data
const getChannelRevenue = async (userId, channelId, startDate, endDate) => {
  try {
    // Get user's access token
    const tokenRecord = await GoogleAccessToken.findOne({
      where: { channel_db_id: channelId, is_active: true }
    });

    if (!tokenRecord) {
      return {
        success: false,
        error: 'No active YouTube authorization found'
      };
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenRecord.accessToken;
    if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
      const refreshResult = await refreshAccessToken(tokenRecord.refreshToken);
      if (!refreshResult.success) {
        return {
          success: false,
          error: 'Failed to refresh access token'
        };
      }
      accessToken = refreshResult.tokens.access_token;
      
      // Update token record
      await tokenRecord.update({
        accessToken: refreshResult.tokens.access_token,
        expiresAt: refreshResult.tokens.expiry_date ? new Date(refreshResult.tokens.expiry_date) : null
      });
    }

    // Check if user has analytics access
    if (!tokenRecord.scope.includes('yt-analytics-monetary.readonly')) {
      return {
        success: false,
        error: 'User does not have YouTube Analytics access'
      };
    }

    // Create YouTube Analytics client
    const analyticsClient = createYouTubeAnalyticsClient(accessToken);

    // Get channel revenue data
    const response = await analyticsClient.reports.query({
      ids: `channel==${channelId}`,
      startDate: startDate,
      endDate: endDate,
      metrics: 'estimatedRevenue,adImpressions,cpm',
      dimensions: 'day',
      sort: 'day'
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('Error getting channel revenue:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get video revenue data
const getVideoRevenue = async (userId, videoId, startDate, endDate) => {
  try {
    // Get user's access token
    const tokenRecord = await GoogleAccessToken.findOne({
      where: { channel_db_id: videoId, is_active: true }
    });

    if (!tokenRecord) {
      return {
        success: false,
        error: 'No active YouTube authorization found'
      };
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenRecord.accessToken;
    if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
      const refreshResult = await refreshAccessToken(tokenRecord.refreshToken);
      if (!refreshResult.success) {
        return {
          success: false,
          error: 'Failed to refresh access token'
        };
      }
      accessToken = refreshResult.tokens.access_token;
      
      // Update token record
      await tokenRecord.update({
        accessToken: refreshResult.tokens.access_token,
        expiresAt: refreshResult.tokens.expiry_date ? new Date(refreshResult.tokens.expiry_date) : null
      });
    }

    // Check if user has analytics access
    if (!tokenRecord.scope.includes('yt-analytics-monetary.readonly')) {
      return {
        success: false,
        error: 'User does not have YouTube Analytics access'
      };
    }

    // Create YouTube Analytics client
    const analyticsClient = createYouTubeAnalyticsClient(accessToken);

    // Get video revenue data
    const response = await analyticsClient.reports.query({
      ids: `video==${videoId}`,
      startDate: startDate,
      endDate: endDate,
      metrics: 'estimatedRevenue,adImpressions,cpm',
      dimensions: 'day',
      sort: 'day'
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('Error getting video revenue:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get aggregated revenue data for multiple channels/videos (from DB)
const getAggregatedRevenue = async (userId, ids, startDate, endDate, groupBy = 'channel', timeGroup = 'day') => {
  try {
    let data = [];
    let groupField, model, idField;
    let timeTrunc = 'day';
    if (timeGroup === 'week') timeTrunc = 'week';
    if (timeGroup === 'month') timeTrunc = 'month';

    if (groupBy === 'channel') {
      model = ChannelStatistics;
      idField = 'channel_db_id';
      groupField = 'channel_db_id';
    } else {
      model = VideoStatistics;
      idField = 'video_db_id';
      groupField = 'video_db_id';
    }

    data = await model.findAll({
      where: {
        [idField]: { [Op.in]: ids },
        date: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        [fn('date_trunc', timeTrunc, col('date')), 'period'],
        [fn('sum', col('estimated_revenue')), 'totalRevenue'],
        [fn('sum', col('view_count')), 'totalViews'],
        [fn('count', col('id')), groupBy === 'channel' ? 'videoCount' : 'channelCount'],
        groupField
      ],
      group: ['period', groupField],
      order: [[literal('period'), 'ASC']]
    });

    // Format lại dữ liệu trả về
    const result = data.map(row => ({
      period: row.get('period'),
      totalRevenue: parseFloat(row.get('totalRevenue')) || 0,
      totalViews: parseInt(row.get('totalViews')) || 0,
      channelCount: groupBy === 'channel' ? 1 : parseInt(row.get('channelCount')) || 0,
      videoCount: groupBy === 'video' ? 1 : parseInt(row.get('videoCount')) || 0,
      [groupField]: row.get(groupField)
    }));

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error getting aggregated revenue from DB:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  getChannelRevenue,
  getVideoRevenue,
  getAggregatedRevenue
}; 