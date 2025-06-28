const express = require('express');
const router = express.Router();
const { 
  syncChannelData, 
  syncRevenueDataForPeriod, 
  syncAllUserChannelsRevenue, 
  getSyncStatus 
} = require('../controllers/youtubeSyncController');

// Sync toàn bộ dữ liệu kênh (bao gồm revenue)
router.post('/channel', syncChannelData);

// Sync revenue data cho kênh/video cụ thể
router.post('/revenue', syncRevenueDataForPeriod);

// Sync revenue data cho tất cả kênh của user
router.post('/revenue/all-channels', syncAllUserChannelsRevenue);

// Get sync status và thống kê
router.get('/status/:userId', getSyncStatus);

module.exports = router; 