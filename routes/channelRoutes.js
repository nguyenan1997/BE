const express = require('express');
const router = express.Router();
const { getAllUserChannels, deleteChannel } = require('../controllers/userChannelController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Lấy tất cả channel mà user hiện tại quản lý
router.get('/', authenticateToken, getAllUserChannels);

// Xoá channel (chỉ owner hoặc admin)
router.delete('/delete/:channelDbId', authenticateToken, deleteChannel);

module.exports = router; 