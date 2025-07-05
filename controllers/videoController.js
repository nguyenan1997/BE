const { getVideosOfChannel, fetchVideoStatistics } = require('../services/videoService');

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         channel_db_id:
 *           type: string
 *         video_id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         published_at:
 *           type: string
 *           format: date-time
 *         thumbnail_url:
 *           type: string
 *         duration:
 *           type: string
 *         privacy_status:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *     VideoStatistics:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         video_db_id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         view_count:
 *           type: integer
 *         like_count:
 *           type: integer
 *         comment_count:
 *           type: integer
 *         share_count:
 *           type: integer
 *         watch_time_minutes:
 *           type: integer
 *         estimated_revenue:
 *           type: number
 *           format: float
 *         created_at:
 *           type: string
 *           format: date-time
 *     YouTubeChannel:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         channel_id:
 *           type: string
 *         channel_title:
 *           type: string
 *         channel_description:
 *           type: string
 *         channel_custom_url:
 *           type: string
 *         channel_country:
 *           type: string
 *         channel_thumbnail_url:
 *           type: string
 *         channel_creation_date:
 *           type: string
 *           format: date-time
 *         is_verified:
 *           type: boolean
 *         is_monitized:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */
/**
 * @swagger
 * /api/channels/{channelDbId}/videos:
 *   get:
 *     summary: Lấy danh sách video của một channel (có phân trang)
 *     tags:
 *       - Video
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelDbId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của channel trong database
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
 *         description: Số lượng video mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách video lấy thành công (có phân trang)
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
 *                 videos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Lỗi server
 */
const getVideosByChannel = async (req, res) => {
  try {
    const { channelDbId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getVideosOfChannel(channelDbId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /api/videos/{videoDbId}/statistics:
 *   get:
 *     summary: Lấy tất cả thống kê của một video (có thể lọc theo số ngày gần nhất, mặc định 7)
 *     tags:
 *       - Video
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoDbId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của video trong database
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Số ngày gần nhất muốn lấy thống kê (tối đa số ngày YouTube API đã cập nhật)
 *     responses:
 *       200:
 *         description: Danh sách thống kê video lấy thành công (các ngày gần nhất có dữ liệu)
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
 *                     $ref: '#/components/schemas/VideoStatistics'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Lỗi server
 */
const getVideoStatistics = async (req, res) => {
  try {
    const { videoDbId } = req.params;
    const days = parseInt(req.query.days) || 7;
    const stats = await fetchVideoStatistics(videoDbId, days);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getVideosByChannel, getVideoStatistics }; 