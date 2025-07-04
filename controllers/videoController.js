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
 *     summary: Lấy danh sách video của một channel
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
 *     responses:
 *       200:
 *         description: Danh sách video lấy thành công
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
 *                     $ref: '#/components/schemas/Video'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Lỗi server
 */
const getVideosByChannel = async (req, res) => {
  try {
    const { channelDbId } = req.params;
    const videos = await getVideosOfChannel(channelDbId);
    res.json({ success: true, data: videos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @swagger
 * /api/videos/{videoDbId}/statistics:
 *   get:
 *     summary: Lấy tất cả thống kê của một video(Hiện tại chỉ lưu trong 7 ngày gần nhất)
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
 *     responses:
 *       200:
 *         description: Danh sách thống kê video lấy thành công
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
    const stats = await fetchVideoStatistics(videoDbId);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getVideosByChannel, getVideoStatistics }; 