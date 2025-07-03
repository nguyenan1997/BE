const axios = require("axios");
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
    if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
      const refreshResult = await refreshAccessToken(tokenRecord.refreshToken);
      if (!refreshResult.success) {
        throw new Error("Failed to refresh access token");
      }
      accessToken = refreshResult.tokens.access_token;

      // Cập nhật token mới
      await tokenRecord.update({
        accessToken: refreshResult.tokens.access_token,
        expiresAt: refreshResult.tokens.expiry_date
          ? new Date(refreshResult.tokens.expiry_date)
          : null,
      });
    } else {
      accessToken = tokenRecord.accessToken;
    }

    // Kiểm tra quyền analytics
    if (!tokenRecord.scope.includes("yt-analytics-monetary.readonly")) {
      console.warn(
        "User does not have YouTube Analytics access. Revenue data will be null."
      );
    }
  }

  // 1. Lấy thông tin kênh
  const channelRes = await axios.get(
    "https://www.googleapis.com/youtube/v3/channels",
    {
      params: {
        part: "snippet,statistics,brandingSettings,contentDetails",
        id: channelId,
        access_token: accessToken,
      },
    }
  );
  const channel = channelRes.data.items[0];
  if (!channel) throw new Error("Không tìm thấy channel");

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
  });

  channelDbId = dbChannel[0].id || dbChannel.id;

  // --- Tạo liên kết user-channel nếu chưa có ---
  const UserChannel = require("../models/UserChannel");
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
 * Sync revenue data cho kênh và video cụ thể
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.channelId (optional)
 * @param {string} params.videoId (optional)
 * @param {string} params.startDate (YYYY-MM-DD)
 * @param {string} params.endDate (YYYY-MM-DD)
 */
async function syncRevenueData({
  userId,
  channelId = null,
  videoId = null,
  startDate,
  endDate,
}) {
  // Lấy access token
  const tokenRecord = await GoogleAccessToken.findOne({
    where: { user_id: userId, is_active: true, channel_db_id: channelId },
  });

  if (!tokenRecord) {
    throw new Error("No active YouTube authorization found for user");
  }

  // Check và refresh token nếu cần
  let accessToken = tokenRecord.accessToken;
  if (tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt) {
    const refreshResult = await refreshAccessToken(tokenRecord.refreshToken);
    if (!refreshResult.success) {
      throw new Error("Failed to refresh access token");
    }
    accessToken = refreshResult.tokens.access_token;

    await tokenRecord.update({
      accessToken: refreshResult.tokens.access_token,
      expiresAt: refreshResult.tokens.expiry_date
        ? new Date(refreshResult.tokens.expiry_date)
        : null,
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
        metrics: "estimatedRevenue,adImpressions,cpm",
        dimensions: "day",
        sort: "day",
      });

      if (channelRevenueRes.data.rows) {
        for (const row of channelRevenueRes.data.rows) {
          const [date, revenue, impressions, cpm] = row;

          // Tìm channel trong database
          const channel = await YouTubeChannel.findOne({
            where: { channel_id: channelId },
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
        results.push(
          `Channel revenue synced for ${channelRevenueRes.data.rows.length} days`
        );
      }
    } catch (error) {
      console.error("Failed to sync channel revenue:", error);
      results.push("Channel revenue sync failed");
    }
  }

  // Sync video revenue
  if (videoId) {
    try {
      const videoRevenueRes = await analyticsClient.reports.query({
        ids: `video==${videoId}`,
        startDate: startDate,
        endDate: endDate,
        metrics: "estimatedRevenue,adImpressions,cpm",
        dimensions: "day",
        sort: "day",
      });

      if (videoRevenueRes.data.rows) {
        for (const row of videoRevenueRes.data.rows) {
          const [date, revenue, impressions, cpm] = row;

          // Tìm video trong database
          const video = await Video.findOne({
            where: { video_id: videoId },
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
        results.push(
          `Video revenue synced for ${videoRevenueRes.data.rows.length} days`
        );
      }
    } catch (error) {
      console.error("Failed to sync video revenue:", error);
      results.push("Video revenue sync failed");
    }
  }

  return {
    success: true,
    results: results,
  };
}

module.exports = {
  syncYouTubeChannelData,
  syncRevenueData,
};