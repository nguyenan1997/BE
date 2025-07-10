const express = require('express');
const { getUserHistoryLogs, getChannelHistoryLogs } = require('../controllers/syncHistoryController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, getUserHistoryLogs);
router.get('/:channelDbId', authenticateToken, getChannelHistoryLogs);

module.exports = router; 