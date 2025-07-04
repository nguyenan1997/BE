const express = require('express');
const router = express.Router();
const { getVideosByChannel, getVideoStatistics } = require('../controllers/videoController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/channels/:channelDbId/videos', authenticateToken, getVideosByChannel);
router.get('/videos/:videoDbId/statistics', authenticateToken, getVideoStatistics);

module.exports = router; 