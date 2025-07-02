const { createYouTubeAnalyticsClient, refreshAccessToken } = require('../config/youtube');
const { GoogleAccessToken } = require('../models');

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

// Get aggregated revenue data for multiple channels/videos
const getAggregatedRevenue = async (userId, ids, startDate, endDate, groupBy = 'channel') => {
  try {
    // Get user's access token
    const tokenRecord = await GoogleAccessToken.findOne({
      where: { channel_db_id: ids[0], is_active: true }
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

    // Build ids parameter
    const idsParam = groupBy === 'channel' 
      ? `channel==${ids.join(',')}`
      : `video==${ids.join(',')}`;

    // Get aggregated revenue data
    const response = await analyticsClient.reports.query({
      ids: idsParam,
      startDate: startDate,
      endDate: endDate,
      metrics: 'estimatedRevenue,adImpressions,cpm',
      dimensions: groupBy === 'channel' ? 'channel' : 'video',
      sort: '-estimatedRevenue'
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('Error getting aggregated revenue:', error);
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