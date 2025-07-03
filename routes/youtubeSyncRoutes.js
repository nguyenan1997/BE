const express = require('express');
const router = express.Router();
const { 
  syncChannelData,
  getSyncStatus,
  refreshAllChannelData
} = require('../controllers/youtubeSyncController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Sync toàn bộ dữ liệu kênh (bao gồm revenue)
router.post('/channel', authenticateToken, syncChannelData);
// Get sync status và thống kê
router.get('/status', authenticateToken, getSyncStatus);
// Refresh channel data on demand
router.post('/refresh', authenticateToken, refreshAllChannelData);

module.exports = router; 