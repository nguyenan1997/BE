const YoutubeHistoryLogs = require('../models/YoutubeHistoryLogs');
const UserChannel = require('../models/UserChannel');

/**
 * @swagger
 * components:
 *   schemas:
 *     SyncHistoryLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         channelDbId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [success, failed]
 *         result:
 *           type: string
 *         list_video_new:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               published_at:
 *                 type: string
 *                 format: date-time
 *               thumbnail_url:
 *                 type: string
 *         finishedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/sync-history:
 *   get:
 *     summary: Lấy lịch sử đồng bộ của user hiện tại (tất cả channel)
 *     tags: [Sync History]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Danh sách lịch sử đồng bộ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SyncHistoryLog'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */


// Lấy lịch sử của user hiện tại
const getUserHistoryLogs = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const userChannels = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
    const userChannelIds = userChannels.map(uc => uc.id);
    const logs = await YoutubeHistoryLogs.findAll({
      where: { user_channel_id: userChannelIds },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserChannel,
          as: 'user_channel',
          include: [
            {
              model: require('../models/YouTubeChannel'),
              as: 'youtube_channel',
              attributes: ['channel_title']
            }
          ]
        }
      ]
    });
    // Format lại chỉ trả về các trường log cần thiết và channel_title
    const result = logs.map(log => ({
      id: log.id,
      status: log.status,
      result: log.result,
      list_video_new: log.list_video_new,
      finishedAt: log.finishedAt,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      channel_title: log.user_channel?.youtube_channel?.channel_title || null
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/sync-history/{channelDbId}:
 *   get:
 *     summary: Lấy lịch sử đồng bộ của một channel cụ thể
 *     tags: [Sync History]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: channelDbId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của channel trong database
 *     responses:
 *       200:
 *         description: Danh sách lịch sử đồng bộ của channel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SyncHistoryLog'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// Lấy lịch sử của một channel cụ thể (chỉ lịch sử của user hiện tại)
const getChannelHistoryLogs = async (req, res) => {
  try {
    const { channelDbId } = req.params;
    const userId = req.currentUser.id;
    const userChannel = await UserChannel.findOne({
      where: { user_id: userId, channel_db_id: channelDbId, is_active: true }
    });
    if (!userChannel) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this channel history.'
      });
    }
    const logs = await YoutubeHistoryLogs.findAll({
      where: { user_channel_id: userChannel.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserChannel,
          as: 'user_channel',
          include: [
            {
              model: require('../models/YouTubeChannel'),
              as: 'youtube_channel',
              attributes: ['channel_title']
            }
          ]
        }
      ]
    });
    // Format lại chỉ trả về các trường log cần thiết và channel_title
    const result = logs.map(log => ({
      id: log.id,
      status: log.status,
      result: log.result,
      list_video_new: log.list_video_new,
      finishedAt: log.finishedAt,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      channel_title: log.user_channel?.youtube_channel?.channel_title || null
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserHistoryLogs,
  getChannelHistoryLogs,
}; 