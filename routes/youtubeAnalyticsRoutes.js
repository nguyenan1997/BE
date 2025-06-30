const express = require('express');
const router = express.Router();
const { 
  getChannelRevenueData, 
  getVideoRevenueData, 
  getAggregatedRevenueData 
} = require('../controllers/youtubeAnalyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get channel revenue data
router.get('/channel/revenue', authenticateToken, getChannelRevenueData);

// Get video revenue data
router.get('/video/revenue', authenticateToken, getVideoRevenueData);

// Get aggregated revenue data
router.get('/aggregated/revenue', authenticateToken, getAggregatedRevenueData);

module.exports = router; 