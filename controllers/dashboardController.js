const { getTotalViewsOfUserChannels, getTotalRevenueOfUserChannels, getRecentChannelsOfUser } = require('../services/dashboardService');

/**
 * @swagger
 * /api/dashboard/total-views-subscribers:
 *   get:
 *     summary: Lấy tổng view và tổng sub của toàn bộ channel user quản lý theo từng ngày
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Số ngày gần nhất muốn lấy (tối đa số ngày có dữ liệu)
 *     responses:
 *       200:
 *         description: Tổng view và tổng sub từng ngày
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
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "2025-07-01"
 *                       total_view:
 *                         type: integer
 *                         example: 12345
 *                       total_subscriber:
 *                         type: integer
 *                         example: 6789
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Lỗi server
 */

// GET /api/dashboard/total-views?days=7
const getTotalViews = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const days = parseInt(req.query.days) || 7;
    const data = await getTotalViewsOfUserChannels(userId, days);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /api/dashboard/total-revenue:
 *   get:
 *     summary: Lấy tổng doanh thu của toàn bộ channel user quản lý theo từng ngày
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Số ngày gần nhất muốn lấy (tối đa số ngày có dữ liệu)
 *     responses:
 *       200:
 *         description: Tổng doanh thu từng ngày
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
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         example: "2025-07-01"
 *                       total_revenue:
 *                         type: number
 *                         example: 67.89
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Lỗi server
 */

// GET /api/dashboard/total-revenue?days=7
const getTotalRevenue = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const days = parseInt(req.query.days) || 7;
    const data = await getTotalRevenueOfUserChannels(userId, days);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /api/dashboard/recent-channels:
 *   get:
 *     summary: Lấy danh sách kênh mới thêm gần đây của user
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Số lượng kênh mới nhất muốn lấy
 *     responses:
 *       200:
 *         description: Danh sách kênh mới nhất
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 channels:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/YouTubeChannel'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Lỗi server
 */

// GET /api/dashboard/recent-channels?limit=6
const getRecentChannels = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    const limit = parseInt(req.query.limit) || 6;
    const channels = await getRecentChannelsOfUser(userId, limit);
    res.json({ success: true, channels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTotalViews, getTotalRevenue, getRecentChannels }; 