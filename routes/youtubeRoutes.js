const express = require('express');
const router = express.Router();
const { 
  fetchAndAnalyze, 
  getAnalysisStatus, 
  getAnalysisResult, 
  getAllChannels, 
  deleteChannel,
  updateChannelWarnings
} = require('../controllers/youtubeController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Tất cả routes đều yêu cầu authentication
router.post('/analyze', authenticateToken, fetchAndAnalyze);
router.get('/status/:id', authenticateToken, getAnalysisStatus);
router.get('/result/:id', authenticateToken, getAnalysisResult);
router.get('/channels', authenticateToken, getAllChannels);
router.delete('/channels/:id', authenticateToken, deleteChannel);
router.put('/channels/:id/warnings', authenticateToken, updateChannelWarnings);

module.exports = router; 