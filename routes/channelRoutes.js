const express = require('express');
const router = express.Router();
const { getAllUserChannels, deleteChannel, getChannelStatisticsController } = require('../controllers/userChannelController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Lấy tất cả channel mà user hiện tại quản lý
router.get('/', authenticateToken, getAllUserChannels);

// Xoá channel (chỉ owner hoặc admin)
router.delete('/delete/:channelDbId', authenticateToken, deleteChannel);

// Lấy thống kê 7 ngày của 1 channel cụ thể
router.get('/:channelDbId/statistics', authenticateToken, getChannelStatisticsController);

module.exports = router; 