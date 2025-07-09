const express = require('express');
const { getUserHistoryLogs, getChannelHistoryLogs } = require('../controllers/syncHistoryController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me/sync-history', authenticateToken, getUserHistoryLogs);
router.get('/:channelDbId/sync-history', authenticateToken, getChannelHistoryLogs);

module.exports = router; 