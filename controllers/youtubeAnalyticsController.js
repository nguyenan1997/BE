const { 
  getChannelRevenue, 
  getVideoRevenue, 
  getAggregatedRevenue 
} = require('../services/youtubeAnalyticsService');

/**
 * @swagger
 * /api/youtube-analytics/channel-revenue:
 *   get:
 *     summary: Lấy doanh thu kênh theo khoảng thời gian
 *     tags: [YouTube Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dữ liệu doanh thu kênh
 *       400:
 *         description: Thiếu tham số hoặc lỗi
 */
// Get channel revenue data
const getChannelRevenueData = async (req, res) => {
  try {
    const { userId } = req.params;
    const { channelId, startDate, endDate } = req.query;
    
    if (!userId || !channelId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'User ID, channel ID, start date, and end date are required'
      });
    }

    const result = await getChannelRevenue(userId, channelId, startDate, endDate);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error getting channel revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get channel revenue data',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/youtube-analytics/video-revenue:
 *   get:
 *     summary: Lấy doanh thu video theo khoảng thời gian
 *     tags: [YouTube Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dữ liệu doanh thu video
 *       400:
 *         description: Thiếu tham số hoặc lỗi
 */
// Get video revenue data
const getVideoRevenueData = async (req, res) => {
  try {
    const { userId } = req.params;
    const { videoId, startDate, endDate } = req.query;
    
    if (!userId || !videoId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'User ID, video ID, start date, and end date are required'
      });
    }

    const result = await getVideoRevenue(userId, videoId, startDate, endDate);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error getting video revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video revenue data',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/youtube-analytics/aggregated-revenue:
 *   get:
 *     summary: Lấy doanh thu tổng hợp (group by channel/video) theo khoảng thời gian
 *     tags: [YouTube Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Danh sách channelId hoặc videoId, phân tách bằng dấu phẩy
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         description: Nhóm theo kênh hoặc video (mặc định: channel)
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - channel
 *             - video
 *     responses:
 *       200:
 *         description: Dữ liệu doanh thu tổng hợp
 *       400:
 *         description: Thiếu tham số hoặc lỗi
 */
// Get aggregated revenue data
const getAggregatedRevenueData = async (req, res) => {
  try {
    const { userId } = req.params;
    const { ids, startDate, endDate, groupBy = 'channel' } = req.query;
    
    if (!userId || !ids || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'User ID, IDs, start date, and end date are required'
      });
    }

    // Parse IDs array
    const idArray = Array.isArray(ids) ? ids : ids.split(',');
    
    if (idArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one ID is required'
      });
    }

    const result = await getAggregatedRevenue(userId, idArray, startDate, endDate, groupBy);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error getting aggregated revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get aggregated revenue data',
      error: error.message
    });
  }
};

module.exports = {
  getChannelRevenueData,
  getVideoRevenueData,
  getAggregatedRevenueData
}; 