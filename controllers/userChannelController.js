const { getUserChannels } = require('../services/userChannelService');

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: Lấy danh sách tất cả channel mà user hiện tại quản lý
 *     tags:
 *       - Channel
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách channel lấy thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
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
    const channels = await getUserChannels(userId);
    res.json({ success: true, data: channels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllUserChannels,
}; 