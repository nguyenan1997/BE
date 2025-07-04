const express = require('express');
const router = express.Router();
const { getVideosByChannel } = require('../controllers/videoController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/channels/:channelDbId/videos', authenticateToken, getVideosByChannel);

module.exports = router; 