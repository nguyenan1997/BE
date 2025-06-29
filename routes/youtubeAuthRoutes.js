const express = require('express');
const router = express.Router();
const { 
  getAuthUrl, 
  handleCallback, 
  refreshToken, 
  getAuthStatus, 
  revokeAuth,
  handleCallbackAndSync
} = require('../controllers/youtubeAuthController');
const { exchangeCodeForTokens } = require('../config/youtube');
const { syncYouTubeChannelData } = require('../services/youtubeSyncService');
const { User } = require('../models');

// Generate OAuth2 authorization URL
router.post('/auth-url', getAuthUrl);

// Handle OAuth2 callback (GET request from YouTube)
router.get('/callback', handleCallbackAndSync);

// Refresh access token
router.post('/refresh', refreshToken);

// Get user's YouTube authorization status
router.get('/status/:userId', getAuthStatus);

// Revoke YouTube authorization
router.delete('/revoke/:userId', revokeAuth);

module.exports = router; 