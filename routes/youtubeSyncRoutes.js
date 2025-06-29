const express = require('express');
const router = express.Router();
const { 
  syncChannelData, 
  syncRevenueDataForPeriod, 
  syncAllUserChannelsRevenue, 
  getSyncStatus 
} = require('../controllers/youtubeSyncController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Sync toàn bộ dữ liệu kênh (bao gồm revenue)
router.post('/channel', authenticateToken, syncChannelData);

// Sync revenue data cho kênh/video cụ thể
router.post('/revenue', authenticateToken, syncRevenueDataForPeriod);

// Sync revenue data cho tất cả kênh của user
router.post('/revenue/all-channels', authenticateToken, syncAllUserChannelsRevenue);

// Get sync status và thống kê
router.get('/status', authenticateToken, getSyncStatus);

module.exports = router; 