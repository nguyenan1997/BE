const express = require('express');
const router = express.Router();
const { 
  getAuthUrl,  
  refreshToken, 
  getAuthStatus, 
  revokeAuth,
  handleCallbackAndSync
} = require('../controllers/youtubeAuthController');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/authMiddleware');

// Generate OAuth2 authorization URL
router.post('/auth-url', authenticateToken, getAuthUrl);

// Handle OAuth2 callback (GET request from YouTube)
router.get('/callback', handleCallbackAndSync);

// Refresh access token
router.post('/refresh', authenticateToken, refreshToken);

// Get user's YouTube authorization status
router.get('/status', authenticateToken, getAuthStatus);

// Revoke YouTube authorization
router.delete('/revoke', authenticateToken, revokeAuth);

module.exports = router; 