const { getUserChannels } = require('../services/userChannelService');

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

module.exports = {
  getAllUserChannels,
}; 