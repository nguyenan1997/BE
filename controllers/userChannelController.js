const { getUserChannels, deleteChannelById, getChannelStatistics, searchChannels } = require('../services/userChannelService');
const UserChannel = require('../models/UserChannel'); // Added missing import

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

/**
 * @swagger
 * /api/channels/{channelDbId}/statistics:
 *   get:
 *     summary: Lấy thống kê 7 ngày của 1 channel cụ thể (view, like, subscriber, revenue)
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
 *           format: uuid
 *         description: ID của channel trong database
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Số ngày gần nhất muốn lấy (tối đa 30 ngày)
 *     responses:
 *       200:
 *         description: Thống kê 7 ngày của channel
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
 *                         format: date
 *                         example: "2025-01-15"
 *                       view_count:
 *                         type: integer
 *                         example: 12345
 *                       like_count:
 *                         type: integer
 *                         example: 567
 *                       subscriber_count:
 *                         type: integer
 *                         example: 89
 *                       estimated_revenue:
 *                         type: number
 *                         format: float
 *                         example: 12.34
 *                       comment_count:
 *                         type: integer
 *                         example: 123
 *                       share_count:
 *                         type: integer
 *                         example: 45
 *                       watch_time_minutes:
 *                         type: integer
 *                         example: 6789
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Không có quyền truy cập channel này
 *       404:
 *         description: Không tìm thấy channel
 *       500:
 *         description: Lỗi server
 */
const getChannelStatisticsController = async (req, res) => {
  try {
    const { channelDbId } = req.params;
    const days = Math.min(parseInt(req.query.days), 7);
    const currentUser = req.currentUser;
    const User = require('../models/User');
    const YouTubeChannel = require('../models/YouTubeChannel');
    const UserChannel = require('../models/UserChannel');

    // Lấy channel và owner
    const channel = await YouTubeChannel.findByPk(channelDbId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }
    const ownerLink = await UserChannel.findOne({ where: { channel_db_id: channelDbId, is_owner: true } });
    const owner = ownerLink ? await User.findByPk(ownerLink.user_id) : null;

    // Phân quyền xem thống kê channel
    switch (currentUser.role) {
      case 'superadmin':
        // Xem được mọi channel
        break;
      case 'admin':
        if (owner && owner.role === 'superadmin') {
          return res.status(403).json({ success: false, message: 'Admin cannot view channel of superadmin.' });
        }
        break;
      case 'partner_company':
      case 'employee_partner': {
        const userChannel = await UserChannel.findOne({ where: { channel_db_id: channelDbId, user_id: currentUser.id, is_active: true } });
        if (!userChannel) {
          return res.status(403).json({ success: false, message: 'You do not have permission to access this channel' });
        }
        break;
      }
      default:
        return res.status(403).json({ success: false, message: 'You do not have permission to access this channel' });
    }

    const data = await getChannelStatistics(channelDbId, days);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /api/channels/search:
 *   get:
 *     summary: Tìm kiếm channel theo từ khóa
 *     tags:
 *       - Channel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (theo tên channel)
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
 *         description: Danh sách channel tìm được
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
 *                   example: 5
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
 *       400:
 *         description: Thiếu từ khóa tìm kiếm
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Lỗi server
 */
const searchChannelsController = async (req, res) => {
  try {
    const { q: searchTerm, page: pageParam, limit: limitParam } = req.query;
    
    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search keyword cannot be empty' 
      });
    }
    
    const userId = req.currentUser.id;
    const page = parseInt(pageParam) || 1;
    const limit = parseInt(limitParam) || 10;
    
    const result = await searchChannels(userId, searchTerm.trim(), page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllUserChannels,
  deleteChannel,
  getChannelStatisticsController,
  searchChannelsController
}; 