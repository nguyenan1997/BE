const UserChannel = require("../models/UserChannel");
const { YouTubeChannel } = require("../models");
const { syncYouTubeChannelData }= require("../services/youtubeSyncService");
const syncQueue = require('../queues/syncQueue');

// Get sync status và thống kê
const getSyncStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const {
      YouTubeChannel,
      ChannelStatistics,
      Video,
      VideoStatistics,
      AccessToken,
    } = require("../models");
    const SharedChannel = require("../models/UserChannel");
    // Lấy danh sách channel_db_id của user
    const links = await SharedChannel.findAll({
      where: { user_id: userId, is_active: true },
    });
    const channelDbIds = links.map((link) => link.channel_db_id);

    // Thống kê dữ liệu
    const channelCount = channelDbIds.length;

    const videoCount = await Video.count({
      where: { channel_db_id: channelDbIds },
    });

    const latestChannelStats = await ChannelStatistics.findOne({
      where: { channel_db_id: channelDbIds },
      order: [["date", "DESC"]],
    });

    const latestVideoStats = await VideoStatistics.findOne({
      include: [
        {
          model: Video,
          as: "video",
          where: { channel_db_id: channelDbIds },
        },
      ],
      order: [["date", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        channels: {
          total: channelCount,
          lastSync: latestChannelStats ? latestChannelStats.date : null,
          hasRevenueData: latestChannelStats
            ? latestChannelStats.estimated_revenue !== null
            : false,
        },
        videos: {
          total: videoCount,
          lastSync: latestVideoStats ? latestVideoStats.date : null,
          hasRevenueData: latestVideoStats
            ? latestVideoStats.estimated_revenue !== null
            : false,
        },
      },
    });
  } catch (error) {
    const isYoutube403 =
      error.message &&
      error.message.includes("not eligible for analytics or monetization");
    res.status(isYoutube403 ? 403 : 500).json({
      success: false,
      message: error.message,
      error: error.stack,
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
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: userId missing" });
    }

    const links = await UserChannel.findAll({
      where: { user_id: userId, is_active: true },
    });
    if (!links.length) {
      return res.status(404).json({ success: false, message: "No channels found for this user." });
    }

    // Đẩy job vào queue cho từng channel
    const jobIds = [];
    for (const link of links) {
      const channel = await YouTubeChannel.findOne({ where: { id: link.channel_db_id } });
      const job = await syncQueue.add('sync-channel', {
        userId,
        channelDbId: link.channel_db_id,
        channelId: channel.channel_id
      });
      jobIds.push({ channelDbId: link.channel_db_id, jobId: job.id });
    }

    // Trả về ngay cho frontend danh sách jobId
    res.json({ success: true, jobs: jobIds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, error: error.stack });
  }
};

module.exports = {
  getSyncStatus,
  refreshAllChannelData,
};
