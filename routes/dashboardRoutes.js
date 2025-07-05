const express = require('express');
const router = express.Router();
const { getTotalViews, getTotalRevenue, getRecentChannels } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/total-views-subscribers', authenticateToken, getTotalViews);
router.get('/total-revenue', authenticateToken, getTotalRevenue);
router.get('/recent-channels', authenticateToken, getRecentChannels);

module.exports = router; 