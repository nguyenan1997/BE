const express = require('express');
const router = express.Router();
const { 
  fetchAndAnalyze, 
  getAnalysisStatus, 
  getAnalysisResult, 
  getAllChannels, 
  deleteChannel,
  addChannelManually,
  analyzeChannelFromUrl,
  getChannelStatisticsHistory,
  getChannelVideos,
  getChannelWarnings,
  getChannelAnalysisHistory,
  updateWarningStatus
} = require('../controllers/youtubeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateAddChannel, validateChannelUrl, validateUpdateWarnings } = require('../validators/youtubeValidator');

// Tất cả routes đều yêu cầu authentication
router.post('/analyze', authenticateToken, fetchAndAnalyze);
router.post('/analyze-url', authenticateToken, validateChannelUrl, analyzeChannelFromUrl);
router.get('/status/:id', authenticateToken, getAnalysisStatus);
router.get('/result/:id', authenticateToken, getAnalysisResult);
router.get('/channels', authenticateToken, getAllChannels);
router.post('/channels', authenticateToken, validateAddChannel, addChannelManually);
router.delete('/channels/:id', authenticateToken, deleteChannel);

// Simplified warning management
router.get('/channels/:id/warnings', authenticateToken, getChannelWarnings);
router.patch('/channels/:id/warnings/:warningId/status', authenticateToken, updateWarningStatus);

// New endpoints for detailed channel management
router.get('/channels/:id/statistics', authenticateToken, getChannelStatisticsHistory);
router.get('/channels/:id/videos', authenticateToken, getChannelVideos);
router.get('/channels/:id/analyses', authenticateToken, getChannelAnalysisHistory);

module.exports = router; 