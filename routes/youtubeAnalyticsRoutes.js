const express = require('express');
const router = express.Router();
const { 
  getChannelRevenueData, 
  getVideoRevenueData, 
  getAggregatedRevenueData 
} = require('../controllers/youtubeAnalyticsController');

// Get channel revenue data
router.get('/channel/:userId/revenue', getChannelRevenueData);

// Get video revenue data
router.get('/video/:userId/revenue', getVideoRevenueData);

// Get aggregated revenue data
router.get('/aggregated/:userId/revenue', getAggregatedRevenueData);

module.exports = router; 