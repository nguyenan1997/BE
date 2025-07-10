const { getUserChannels, deleteChannelById } = require('../services/userChannelService');

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: Lấy danh sách tất cả channel mà user hiện tại quản lý (có phân trang)
 *     tags:
 *       - Channel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng channel mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách channel lấy thành công (có phân trang)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 123
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 channels:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/YouTubeChannel'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Lỗi server
 */
const getAllUserChannels = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getUserChannels(userId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /api/channels/delete/{channelDbId}:
 *   delete:
 *     summary: Xoá channel (chỉ owner hoặc admin)
 *     tags:
 *       - Channel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelDbId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của channel trong DB
 *     responses:
 *       200:
 *         description: Xoá thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Xoá channel thành công
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy channel
 *       500:
 *         description: Lỗi server
 */
const deleteChannel = async (req, res) => {
  try {
    const channelDbId = req.params.channelDbId;
    const userId = req.currentUser.id;
    const userRole = req.currentUser.role;
    await deleteChannelById(channelDbId, userId, userRole);
    res.json({ success: true, message: 'Channel deleted successfully' });
  } catch (err) {
    if (err.message === 'You do not have permission to delete this channel') {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.message === 'No channel found to delete') {
      return res.status(404).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllUserChannels,
  deleteChannel,
}; 