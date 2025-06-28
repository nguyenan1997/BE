const axios = require('axios');
const { User, YouTubeChannel, ChannelStatistics, Video, VideoStatistics, AccessToken } = require('../models');
const { refreshAccessToken, createYouTubeAnalyticsClient } = require('../config/youtube');

/**
 * Đồng bộ dữ liệu từ YouTube API vào database (bao gồm revenue)
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.channelId
 * @param {string} params.accessToken (optional - sẽ lấy từ database nếu không cung cấp)
 */
async function syncYouTubeChannelData({ userId, channelId, accessToken = null }) {
  // Helper lấy field an toàn
  const safe = (obj, path, def = null) => {
    try {
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : def), obj);
    } catch { return def; }
  };

  // Lấy access token từ database nếu không cung cấp
  if (!accessToken) {
    const tokenRecord = await AccessToken.findOne({
      where: { userId: userId, isActive: true }
    });

    if (!tokenRecord) {
      throw new Error('No active YouTube authorization found for user');
    }

    // Check và refresh token nếu cần
    if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
      const refreshResult = await refreshAccessToken(tokenRecord.refreshToken);
      if (!refreshResult.success) {
        throw new Error('Failed to refresh access token');
      }
      accessToken = refreshResult.tokens.access_token;
      
      // Cập nhật token mới
      await tokenRecord.update({
        accessToken: refreshResult.tokens.access_token,
        expiresAt: refreshResult.tokens.expiry_date ? new Date(refreshResult.tokens.expiry_date) : null
      });
    } else {
      accessToken = tokenRecord.accessToken;
    }

    // Kiểm tra quyền analytics
    if (!tokenRecord.scope.includes('yt-analytics-monetary.readonly')) {
      console.warn('User does not have YouTube Analytics access. Revenue data will be null.');
    }
  }

  // 1. Lấy thông tin kênh
  const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
    params: {
      part: 'snippet,statistics,brandingSettings,contentDetails',
      id: channelId,
      access_token: accessToken
    }
  });
  const channel = channelRes.data.items[0];
  if (!channel) throw new Error('Không tìm thấy channel');

  // 2. Lưu vào bảng youtube_channels
  const dbChannel = await YouTubeChannel.upsert({
    user_id: userId,
    channel_id: channel.id,
    channel_title: safe(channel, 'snippet.title'),
    channel_description: safe(channel, 'snippet.description'),
    channel_custom_url: safe(channel, 'snippet.customUrl'),
    channel_country: safe(channel, 'snippet.country'),
    channel_thumbnail_url: safe(channel, 'snippet.thumbnails.high.url') || safe(channel, 'snippet.thumbnails.default.url'),
    channel_creation_date: safe(channel, 'snippet.publishedAt'),
    is_verified: null, // Không có trường này
    is_monitized: null // Không có trường này
  });

  const channelDbId = dbChannel[0].id || dbChannel.id;

  // 3. Lấy revenue data cho kênh (30 ngày gần nhất)
  let channelRevenue = null;
  try {
    const analyticsClient = createYouTubeAnalyticsClient(accessToken);
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const revenueRes = await analyticsClient.reports.query({
      ids: `channel==${channelId}`,
      startDate: startDate,
      endDate: endDate,
      metrics: 'estimatedRevenue,adImpressions,cpm',
      dimensions: 'day',
      sort: 'day'
    });

    if (revenueRes.data.rows && revenueRes.data.rows.length > 0) {
      // Tính tổng revenue 30 ngày
      channelRevenue = revenueRes.data.rows.reduce((sum, row) => sum + (row[1] || 0), 0);
    }
  } catch (error) {
    console.warn('Failed to get channel revenue:', error.message);
  }

  // 4. Lưu thống kê kênh vào channel_statistics
  await ChannelStatistics.create({
    channel_id: channelDbId,
    date: new Date(),
    subscriber_count: parseInt(safe(channel, 'statistics.subscriberCount')) || null,
    view_count: parseInt(safe(channel, 'statistics.viewCount')) || null,
    like_count: null,
    comment_count: null,
    share_count: null,
    watch_time_minutes: null,
    estimated_revenue: channelRevenue,
    view_growth_percent: null,
    subscriber_growth_percent: null
  });

  // 5. Lấy danh sách videoId của kênh (playlist uploads)
  const uploadsPlaylistId = safe(channel, 'contentDetails.relatedPlaylists.uploads');
  let videoIds = [];
  let nextPageToken = null;
  do {
    const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        part: 'contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken: nextPageToken,
        access_token: accessToken
      }
    });
    videoIds.push(...playlistRes.data.items.map(i => i.contentDetails.videoId));
    nextPageToken = playlistRes.data.nextPageToken;
  } while (nextPageToken);

  // 6. Lấy chi tiết video và revenue, lưu vào bảng videos, video_statistics
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videosRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics,contentDetails,status',
        id: batch.join(','),
        access_token: accessToken
      }
    });

    for (const v of videosRes.data.items) {
      const dbVideo = await Video.upsert({
        channel_id: channelDbId,
        video_id: v.id,
        title: safe(v, 'snippet.title'),
        description: safe(v, 'snippet.description'),
        published_at: safe(v, 'snippet.publishedAt'),
        thumbnail_url: safe(v, 'snippet.thumbnails.high.url') || safe(v, 'snippet.thumbnails.default.url'),
        duration: safe(v, 'contentDetails.duration'),
        privacy_status: safe(v, 'status.privacyStatus')
      });

      const videoDbId = dbVideo[0].id || dbVideo.id;

      // Lấy revenue data cho video (30 ngày gần nhất)
      let videoRevenue = null;
      try {
        const analyticsClient = createYouTubeAnalyticsClient(accessToken);
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const videoRevenueRes = await analyticsClient.reports.query({
          ids: `video==${v.id}`,
          startDate: startDate,
          endDate: endDate,
          metrics: 'estimatedRevenue,adImpressions,cpm',
          dimensions: 'day',
          sort: 'day'
        });

        if (videoRevenueRes.data.rows && videoRevenueRes.data.rows.length > 0) {
          // Tính tổng revenue 30 ngày
          videoRevenue = videoRevenueRes.data.rows.reduce((sum, row) => sum + (row[1] || 0), 0);
        }
      } catch (error) {
        console.warn(`Failed to get revenue for video ${v.id}:`, error.message);
      }

      await VideoStatistics.create({
        video_id: videoDbId,
        date: new Date(),
        view_count: parseInt(safe(v, 'statistics.viewCount')) || null,
        like_count: parseInt(safe(v, 'statistics.likeCount')) || null,
        comment_count: parseInt(safe(v, 'statistics.commentCount')) || null,
        share_count: null,
        estimated_revenue: videoRevenue
      });
    }
  }

  return { 
    success: true,
    channelRevenue: channelRevenue,
    videosProcessed: videoIds.length,
    message: 'YouTube data synced successfully with revenue data'
  };
}

/**
 * Sync revenue data cho kênh và video cụ thể
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.channelId (optional)
 * @param {string} params.videoId (optional)
 * @param {string} params.startDate (YYYY-MM-DD)
 * @param {string} params.endDate (YYYY-MM-DD)
 */
async function syncRevenueData({ userId, channelId = null, videoId = null, startDate, endDate }) {
  // Lấy access token
  const tokenRecord = await AccessToken.findOne({
    where: { userId: userId, isActive: true }
  });

  if (!tokenRecord) {
    throw new Error('No active YouTube authorization found for user');
  }

  // Check và refresh token nếu cần
  let accessToken = tokenRecord.accessToken;
  if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
    const refreshResult = await refreshAccessToken(tokenRecord.refreshToken);
    if (!refreshResult.success) {
      throw new Error('Failed to refresh access token');
    }
    accessToken = refreshResult.tokens.access_token;
    
    await tokenRecord.update({
      accessToken: refreshResult.tokens.access_token,
      expiresAt: refreshResult.tokens.expiry_date ? new Date(refreshResult.tokens.expiry_date) : null
    });
  }

  const analyticsClient = createYouTubeAnalyticsClient(accessToken);
  const results = [];

  // Sync channel revenue
  if (channelId) {
    try {
      const channelRevenueRes = await analyticsClient.reports.query({
        ids: `channel==${channelId}`,
        startDate: startDate,
        endDate: endDate,
        metrics: 'estimatedRevenue,adImpressions,cpm',
        dimensions: 'day',
        sort: 'day'
      });

      if (channelRevenueRes.data.rows) {
        for (const row of channelRevenueRes.data.rows) {
          const [date, revenue, impressions, cpm] = row;
          
          // Tìm channel trong database
          const channel = await YouTubeChannel.findOne({
            where: { channel_id: channelId }
          });

          if (channel) {
            await ChannelStatistics.create({
              channel_id: channel.id,
              date: new Date(date),
              estimated_revenue: revenue || null,
              // Các field khác giữ nguyên null
            });
          }
        }
        results.push(`Channel revenue synced for ${channelRevenueRes.data.rows.length} days`);
      }
    } catch (error) {
      console.error('Failed to sync channel revenue:', error);
      results.push('Channel revenue sync failed');
    }
  }

  // Sync video revenue
  if (videoId) {
    try {
      const videoRevenueRes = await analyticsClient.reports.query({
        ids: `video==${videoId}`,
        startDate: startDate,
        endDate: endDate,
        metrics: 'estimatedRevenue,adImpressions,cpm',
        dimensions: 'day',
        sort: 'day'
      });

      if (videoRevenueRes.data.rows) {
        for (const row of videoRevenueRes.data.rows) {
          const [date, revenue, impressions, cpm] = row;
          
          // Tìm video trong database
          const video = await Video.findOne({
            where: { video_id: videoId }
          });

          if (video) {
            await VideoStatistics.create({
              video_id: video.id,
              date: new Date(date),
              estimated_revenue: revenue || null,
              // Các field khác giữ nguyên null
            });
          }
        }
        results.push(`Video revenue synced for ${videoRevenueRes.data.rows.length} days`);
      }
    } catch (error) {
      console.error('Failed to sync video revenue:', error);
      results.push('Video revenue sync failed');
    }
  }

  return {
    success: true,
    results: results
  };
}

module.exports = { 
  syncYouTubeChannelData,
  syncRevenueData
}; 