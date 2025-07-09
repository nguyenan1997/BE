const YoutubeHistoryLogs = require('../models/YoutubeHistoryLogs');
const UserChannel = require('../models/UserChannel');

/**
 * @swagger
 * /api/sync-history/me/sync-history:
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
    const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
    const channelDbIds = links.map(link => link.channel_db_id);
    const logs = await YoutubeHistoryLogs.findAll({
      where: { channelDbId: channelDbIds },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @swagger
 * /api/sync-history/{channelDbId}/sync-history:
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
// Lấy lịch sử của một channel cụ thể
const getChannelHistoryLogs = async (req, res) => {
  try {
    const { channelDbId } = req.params;
    const logs = await YoutubeHistoryLogs.findAll({
      where: { channelDbId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserHistoryLogs,
  getChannelHistoryLogs,
}; 