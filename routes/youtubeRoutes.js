const express = require('express');
const router = express.Router();
const { 
  fetchAndAnalyze, 
  getAnalysisStatus, 
  getAnalysisResult, 
  getAllChannels, 
  deleteChannel,
  updateChannelWarnings,
  addChannelManually,
  analyzeChannelFromUrl
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
router.put('/channels/:id/warnings', authenticateToken, validateUpdateWarnings, updateChannelWarnings);

module.exports = router; 