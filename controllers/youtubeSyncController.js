const UserChannel = require("../models/UserChannel");
const { YouTubeChannel } = require("../models");
const syncQueue = require('../queues/syncQueue');

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
  refreshAllChannelData,
};
