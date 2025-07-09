const express = require('express');
const router = express.Router();
const { 
  refreshAllChannelData
} = require('../controllers/youtubeSyncController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Refresh dữ liệu kênh theo yêu cầu
router.post('/refresh', authenticateToken, refreshAllChannelData);

module.exports = router; 