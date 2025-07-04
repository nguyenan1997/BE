const axios = require("axios");
const UserChannel = require("../models/UserChannel");
const {
  User,
  YouTubeChannel,
  ChannelStatistics,
  Video,
  VideoStatistics,
  GoogleAccessToken,
} = require("../models");
const {
  refreshAccessToken,
  createYouTubeAnalyticsClient,
} = require("../config/youtube");

const ChannelViolation = require('../models/ChannelViolation');

/**
 * Đồng bộ dữ liệu từ YouTube API vào database (bao gồm revenue)
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.channelId
 * @param {string} params.accessToken
 * @param {string} params.refreshToken
 * @param {string} params.scope
 * @param {string} params.tokenType
 * @param {string|Date} params.expiresAt
 */
async function syncYouTubeChannelData({
  userId,
  channelId,
  channelDbId = null,
  accessToken = null,
  refreshToken = null,
  scope = null,
  tokenType = null,
  expiresAt = null,
}) {
  // Helper lấy field an toàn
  const safe = (obj, path, def = null) => {
    try {
      return path
        .split(".")
        .reduce((o, k) => (o && o[k] !== undefined ? o[k] : def), obj);
    } catch {
      return def;
    }
  };

  // Nếu chưa có channelDbId, tra cứu từ DB
  if (!channelDbId) {
    const dbChannel = await YouTubeChannel.findOne({ where: { channel_id: channelId } });
    channelDbId = dbChannel ? dbChannel.id : null;
  }

  // Lấy access token từ database nếu không cung cấp
  if (!accessToken) {
    const tokenRecord = await GoogleAccessToken.findOne({
      where: { channel_db_id: channelDbId, is_active: true },
    });

    if (!tokenRecord) {
      throw new Error("No active YouTube authorization found for user");
    }

    // Check và refresh token nếu cần
    if (tokenRecord.expires_at && new Date() > tokenRecord.expires_at) {
      const refreshResult = await refreshAccessToken(tokenRecord.refresh_token);
      if (!refreshResult.success) {
        console.error("Refresh token failed:", refreshResult);
        throw new Error("Failed to refresh access token");
      }
      accessToken = refreshResult.tokens.access_token;
      await tokenRecord.update({
        access_token: refreshResult.tokens.access_token,
        expires_at: refreshResult.tokens.expiry_date
          ? new Date(refreshResult.tokens.expiry_date)
          : null,
      });
    } else {
      accessToken = tokenRecord.access_token;
    }

    // Kiểm tra quyền analytics
    if (!tokenRecord.scope.includes("yt-analytics-monetary.readonly")) {
      console.warn(
        "User does not have YouTube Analytics access. Revenue data will be null."
      );
    }
  }

  // 1. Lấy thông tin kênh
  let channelRes;
  try{
    channelRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          part: "snippet,statistics,brandingSettings,contentDetails",
          id: channelId,
          access_token: accessToken,
        },
      }
    );
  }
  catch (error) {
    console.error("Error fetching channel data:", error);
  }
  const channel = channelRes.data.items[0];
  if (!channel) throw new Error("Not found YouTube channel with ID: " + channelId);

  // Lấy tổng view và tổng sub hiện tại
  const totalViewCount = Number(channel.statistics.viewCount);
  const totalSubscriberCount = Number(channel.statistics.subscriberCount);

  // 2. Lưu vào bảng youtube_channels
  const dbChannel = await YouTubeChannel.upsert({
    channel_id: channel.id,
    channel_title: safe(channel, "snippet.title"),
    channel_description: safe(channel, "snippet.description"),
    channel_custom_url: safe(channel, "snippet.customUrl"),
    channel_country: safe(channel, "snippet.country"),
    channel_thumbnail_url:
      safe(channel, "snippet.thumbnails.high.url") ||
      safe(channel, "snippet.thumbnails.default.url"),
    channel_creation_date: safe(channel, "snippet.publishedAt"),
    is_verified: null, 
    is_monitized: null,
    total_view_count: totalViewCount,
    total_subscriber_count: totalSubscriberCount,
  });

  channelDbId = dbChannel[0].id || dbChannel.id;

  // --- Tạo liên kết user-channel nếu chưa có ---
  const existingLink = await UserChannel.findOne({
    where: { user_id: userId, channel_db_id: channelDbId }
  });
  if (!existingLink) {
    await UserChannel.create({
      user_id: userId,
      channel_db_id: channelDbId,
      is_owner: true,
      is_active: true
    });
  }

  // --- Update/create AccessToken nếu accessToken được truyền vào ---
  if (accessToken) {
    let tokenRecord = await GoogleAccessToken.findOne({
      where: { channel_db_id: channelDbId, is_active: true },
    });
    if (tokenRecord) {
      await tokenRecord.update({
        access_token: accessToken,
        refresh_token: refreshToken || tokenRecord.refresh_token,
        scope: scope || tokenRecord.scope,
        token_type: tokenType || tokenRecord.token_type,
        expires_at: expiresAt ? new Date(expiresAt) : tokenRecord.expires_at,
        is_active: true,
      });
    } else {
      await GoogleAccessToken.create({
        channel_db_id: channelDbId,
        access_token: accessToken,
        refresh_token: refreshToken,
        scope: scope,
        token_type: tokenType,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        is_active: true,
      });
    }
  }

  // 3. Lấy thống kê từng ngày cho kênh trong 7 ngày gần nhất
  let channelStatsRows = [];
  let channelStatsHeaders = [];
  let analyticsError = null;
  try {
    const analyticsClient = createYouTubeAnalyticsClient(accessToken);
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const channelStatsRes = await analyticsClient.reports.query({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: "views,estimatedRevenue,likes,comments,shares,estimatedMinutesWatched,subscribersGained,subscribersLost",
      dimensions: "day",
      sort: "day",
    });
    channelStatsRows = channelStatsRes.data.rows || [];
    channelStatsHeaders = channelStatsRes.data.columnHeaders || [];
  } catch (error) {
    if (error.code === 403 || (error.response && error.response.status === 403)) {
      analyticsError = "YouTube channel is not eligible for analytics or monetization. Please check if the channel is monetized and you have the correct permissions.";
    } else {
      throw error;
    }
  }

  // 4. Lưu thống kê từng ngày vào channel_statistics (mapping động theo header)
  if (!analyticsError && channelStatsRows.length > 0) {
    for (const row of channelStatsRows) {
      const data = {};
      channelStatsHeaders.forEach((header, idx) => {
        data[header.name] = row[idx];
      });
      await ChannelStatistics.upsert({
        channel_db_id: channelDbId,
        date: data.day,
        subscriber_count: (data.subscribersGained != null && data.subscribersLost != null) ? (data.subscribersGained - data.subscribersLost) : null,
        view_count: data.views,
        like_count: data.likes,
        comment_count: data.comments,
        share_count: data.shares,
        watch_time_minutes: data.estimatedMinutesWatched,
        estimated_revenue: data.estimatedRevenue,
      });
    }
  }

  // 5. Lấy danh sách videoId của kênh (playlist uploads)
  const uploadsPlaylistId = safe(
    channel,
    "contentDetails.relatedPlaylists.uploads"
  );
  let videoIds = [];
  let nextPageToken = null;
  do {
    const playlistRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/playlistItems",
      {
        params: {
          part: "contentDetails",
          playlistId: uploadsPlaylistId,
          maxResults: 50,
          pageToken: nextPageToken,
          access_token: accessToken,
        },
      }
    );
    videoIds.push(
      ...playlistRes.data.items.map((i) => i.contentDetails.videoId)
    );
    nextPageToken = playlistRes.data.nextPageToken;
  } while (nextPageToken);

  // 6. Lấy chi tiết video và thống kê từng ngày, lưu vào bảng videos, video_statistics
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videosRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "snippet,statistics,contentDetails,status",
          id: batch.join(","),
          access_token: accessToken,
        },
      }
    );

    for (const v of videosRes.data.items) {
      // Kiểm tra video đã tồn tại chưa
      const existingVideo = await Video.findOne({
        where: { channel_db_id: channelDbId, video_id: v.id }
      });
      let videoDbId;
      if (existingVideo) {
        videoDbId = existingVideo.id;
        await existingVideo.update({
          title: safe(v, "snippet.title"),
          description: safe(v, "snippet.description"),
          published_at: safe(v, "snippet.publishedAt"),
          thumbnail_url:
            safe(v, "snippet.thumbnails.high.url") ||
            safe(v, "snippet.thumbnails.default.url"),
          duration: safe(v, "contentDetails.duration"),
          privacy_status: safe(v, "status.privacyStatus"),
        });
      } else {
        await Video.create({
          channel_db_id: channelDbId,
          video_id: v.id,
          title: safe(v, "snippet.title"),
          description: safe(v, "snippet.description"),
          published_at: safe(v, "snippet.publishedAt"),
          thumbnail_url:
            safe(v, "snippet.thumbnails.high.url") ||
            safe(v, "snippet.thumbnails.default.url"),
          duration: safe(v, "contentDetails.duration"),
          privacy_status: safe(v, "status.privacyStatus"),
        });
        // Luôn lấy lại bản ghi từ DB để lấy UUID
        const createdVideo = await Video.findOne({
          where: { channel_db_id: channelDbId, video_id: v.id }
        });
        videoDbId = createdVideo.id;
      }

      // Nếu có analytics, lưu vào video_statistics
      if (!analyticsError) {
        // Lấy thống kê từng ngày cho video trong 7 ngày gần nhất
        let videoStatsRows = [];
        let videoStatsHeaders = [];
        try {
          const analyticsClient = createYouTubeAnalyticsClient(accessToken);
          const endDate = new Date().toISOString().split("T")[0];
          const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

          const videoStatsRes = await analyticsClient.reports.query({
            ids: `channel==${channelId}`,
            filters: `video==${v.id}`,
            startDate,
            endDate,
            metrics: "views,estimatedRevenue,likes,comments,shares,estimatedMinutesWatched",
            dimensions: "day",
            sort: "day",
          });
          videoStatsRows = videoStatsRes.data.rows || [];
          videoStatsHeaders = videoStatsRes.data.columnHeaders || [];
        } catch (error) {
          if (error.code === 403 || (error.response && error.response.status === 403)) {
            throw new Error("YouTube video is not eligible for analytics or monetization. Please check if the channel is monetized and you have the correct permissions.");
          }
          throw error;
        }

        for (const row of videoStatsRows) {
          const data = {};
          videoStatsHeaders.forEach((header, idx) => {
            data[header.name] = row[idx];
          });
          await VideoStatistics.upsert({
            video_db_id: videoDbId,
            date: data.day,
            view_count: data.views,
            estimated_revenue: data.estimatedRevenue,
            like_count: data.likes,
            comment_count: data.comments,
            share_count: data.shares,
            watch_time_minutes: data.estimatedMinutesWatched,
          });
        }
      }
    }
  }

  return {
    success: !analyticsError,
    analyticsError,
    message: analyticsError
      ? "Channel not eligible for analytics, but videos have been saved."
      : "YouTube data synced successfully with revenue data",
    channelRevenue: channelStatsRows.reduce((sum, row) => sum + (row[1] || 0), 0),
    videosProcessed: videoIds.length,
  };
}

/**
 * Cập nhật cảnh báo vi phạm cho 1 channel từ webhook n8n
 * @param {string} userId
 * @param {string} channelDbId
 */
async function updateChannelViolationsFromWebhook(userId, channelDbId) {
  // 1. Lấy thông tin user và channel
  const user = await User.findOne({ where: { id: userId } });
  const channel = await YouTubeChannel.findOne({ where: { id: channelDbId } });
  if (!user || !channel) throw new Error('User or Channel does not exist');

  // 2. Lấy handle kênh (bỏ @ nếu có)
  const channelHandle = channel.channel_custom_url
    ? channel.channel_custom_url.replace(/^@/, '')
    : channel.channel_id;

  // 3. Gọi webhook n8n
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  let response;
  try {
    response = await axios.post(webhookUrl, {
      email: user.email,
      channel_handle: channelHandle
    });
  } catch (err) {
    throw new Error('Error calling n8n webhook: ' + err.message);
  }

  const data = response.data;
  if (!data.violations || !Array.isArray(data.violations)) {
    throw new Error('Webhook returned invalid data');
  }

  // 4. Xoá hết cảnh báo cũ của channel này
  await ChannelViolation.destroy({ where: { channel_db_id: channelDbId } });

  // 5. Insert lại toàn bộ cảnh báo mới
  for (const v of data.violations) {
    await ChannelViolation.create({
      channel_db_id: channelDbId,
      violation_type: v.type,
      title: v.title,
      description: v.description,
      status: v.status,
      violation_date: v.date,
      resolved_date: v.status === 'resolved' ? v.resolved_date : null
    });
  }
}

/**
 * Cập nhật cảnh báo cho tất cả các channel của 1 user
 * @param {string} userId
 */
async function updateAllChannelsViolationsForUser(userId) {
  const UserChannel = require('../models/UserChannel');
  const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
  if (!links.length) {
    console.log('User does not have any channels to update violations.');
    return;
  }
  for (const link of links) {
    try {
      await updateChannelViolationsFromWebhook(userId, link.channel_db_id);
      console.log(`Updated violations for channel ${link.channel_db_id}`);
    } catch (err) {
      console.error(`Error updating violations for channel ${link.channel_db_id}:`, err.message);
    }
  }
}

module.exports = {
  syncYouTubeChannelData
};