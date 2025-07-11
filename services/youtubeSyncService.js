const axios = require("axios");
const UserChannel = require("../models/UserChannel");
const {
  User,
  YouTubeChannel,
  ChannelStatistics,
  Video,
  VideoStatistics,
  GoogleAccessToken,
  YoutubeHistoryLogs
} = require("../models");
const {
  refreshAccessToken,
  createYouTubeAnalyticsClient,
} = require("../config/youtube");

const ChannelViolation = require('../models/ChannelViolation');

/**
 * Sync data from YouTube API into the database (including revenue)
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.channelId
 * @param {string} params.accessToken
 * @param {string} params.refreshToken
 * @param {string} params.scope
 * @param {string} params.tokenType
 * @param {string|Date} params.expiresAt
 * @param {string} params.channelEmail
 * @param {string} params.jobId
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
  channelEmail = null
}) {
  // Helper to safely get field value
  const safe = (obj, path, def = null) => {
    try {
      return path
        .split(".")
        .reduce((o, k) => (o && o[k] !== undefined ? o[k] : def), obj);
    } catch {
      return def;
    }
  };

  // If channelDbId is not provided, look up from DB
  let existingChannel = null;
  if (!channelDbId) {
    existingChannel = await YouTubeChannel.findOne({ where: { channel_id: channelId } });
    channelDbId = existingChannel ? existingChannel.id : null;
  } else {
    existingChannel = await YouTubeChannel.findOne({ where: { id: channelDbId } });
  }

  // Get access token from database if not provided
  if (!accessToken) {
    const tokenRecord = await GoogleAccessToken.findOne({
      where: { channel_db_id: channelDbId, is_active: true },
    });

    if (!tokenRecord) {
      throw new Error("No active YouTube authorization found for user");
    }

    // Check and refresh token if needed
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

    // Check analytics permission
    if (!tokenRecord.scope.includes("yt-analytics-monetary.readonly")) {
      console.warn(
        "User does not have YouTube Analytics access. Revenue data will be null."
      );
    }
  }

  // 1. Get channel info
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

  // Get current total view and subscriber count
  const totalViewCount = Number(channel.statistics.viewCount);
  const totalSubscriberCount = Number(channel.statistics.subscriberCount);

  // 2. Save to youtube_channels table
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
    channel_email: channelEmail !== null ? channelEmail : (existingChannel ? existingChannel.channel_email : null),
  });

  channelDbId = dbChannel[0].id || dbChannel.id;

  // --- Create user-channel link if not exists ---
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

  // --- Update/create AccessToken if accessToken is provided ---
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

  // 3. Get daily statistics for the channel for the last 9 days
  let channelStatsRows = [];
  let channelStatsHeaders = [];
  let analyticsError = null;
  try {
    const analyticsClient = createYouTubeAnalyticsClient(accessToken);
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
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

  // 4. Save daily statistics to channel_statistics (dynamic mapping by header)
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

  // 5. Get the list of videoIds of the channel (uploads playlist)
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

  // 6. Get video details and daily statistics, save to videos, video_statistics tables
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
      // Check if video already exists
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
          total_view_count: Number(safe(v, "statistics.viewCount")),
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
          total_view_count: Number(safe(v, "statistics.viewCount")),
        });
        // Always fetch the record from DB to get UUID
        const createdVideo = await Video.findOne({
          where: { channel_db_id: channelDbId, video_id: v.id }
        });
        videoDbId = createdVideo.id;
      }

      // If analytics is available, save to video_statistics
      if (!analyticsError) {
        // Get daily statistics for the video for the last 9 days
        let videoStatsRows = [];
        let videoStatsHeaders = [];
        try {
          const analyticsClient = createYouTubeAnalyticsClient(accessToken);
          const endDate = new Date().toISOString().split("T")[0];
          const startDate = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
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

  // Get all current videos of the channel
  const allVideos = await Video.findAll({
    where: { channel_db_id: channelDbId }
  });
  const list_video_new = allVideos.map(v => ({
    id: v.video_id,
    title: v.title,
    published_at: v.published_at,
    thumbnail_url: v.thumbnail_url
  }));

  let result;
  if (!analyticsError) {
    result = "Channel has been sync success";
  } else {
    result = analyticsError || "Sync failed for unknown reason";
  }

  // Find user_channel
  const userChannel = await UserChannel.findOne({
    where: { user_id: userId, channel_db_id: channelDbId, is_active: true }
  });
  if (!userChannel) throw new Error('User does not have permission for this channel');

  // Write sync history log
  await YoutubeHistoryLogs.create({
    user_channel_id: userChannel.id,
    status: !analyticsError ? 'success' : 'failed',
    result, // result is now just a string
    list_video_new,
    finishedAt: new Date()
  });
  try {
    // await updateAllChannelsViolationsForUser(userId);
  }
  catch (err) {
    console.error('Error updating channel violations:', err.message);
  }
  return {
    status: !analyticsError ? 'success' : 'failed',
    result
  };
}

/**
 * Update channel violations for a channel from n8n webhook
 * @param {string} userId
 * @param {string} channelDbId
 */
async function updateChannelViolationsFromWebhook(userId, channelDbId) {
  // 1. Get user and channel info
  const user = await User.findOne({ where: { id: userId } });
  const channel = await YouTubeChannel.findOne({ where: { id: channelDbId } });
  if (!user || !channel) throw new Error('User or Channel does not exist');

  // 2. Get channel handle (remove @ if present)
  const channelHandle = channel.channel_custom_url
    ? channel.channel_custom_url.replace(/^@/, '')
    : channel.channel_id;

  // 3. Call n8n webhook
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  let response;
  try {
    response = await axios.post(webhookUrl, {
      email: user.email,
      custom_url: channelHandle
    });
  } catch (err) {
    throw new Error('Error calling n8n webhook: ' + err.message);
  }

  const data = response.data;
  if (!data.violations || !Array.isArray(data.violations)) {
    throw new Error('Webhook returned invalid data');
  }

  // 4. Delete all old violations of this channel
  await ChannelViolation.destroy({ where: { channel_db_id: channelDbId } });

  // 5. Insert all new violations
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
 * Update violations for all channels of a user
 * @param {string} userId
 */
async function updateAllChannelsViolationsForUser(userId) {
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