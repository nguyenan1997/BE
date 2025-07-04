const express = require('express');
const router = express.Router();
const { getAllUserChannels } = require('../controllers/userChannelController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Lấy tất cả channel mà user hiện tại quản lý
router.get('/', authenticateToken, getAllUserChannels);

module.exports = router; 