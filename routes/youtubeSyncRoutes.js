const express = require('express');
const router = express.Router();
const { 
  getSyncStatus,
  refreshAllChannelData
} = require('../controllers/youtubeSyncController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Lấy trạng thái đồng bộ dữ liệu
router.get('/status', authenticateToken, getSyncStatus);
// Refresh dữ liệu kênh theo yêu cầu
router.post('/refresh', authenticateToken, refreshAllChannelData);

module.exports = router; 