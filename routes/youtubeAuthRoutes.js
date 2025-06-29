const express = require('express');
const router = express.Router();
const { 
  getAuthUrl,  
  refreshToken, 
  getAuthStatus, 
  revokeAuth,
  handleCallbackAndRedirect,
  finishOAuth
} = require('../controllers/youtubeAuthController');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/authMiddleware');

// Generate OAuth2 authorization URL
router.post('/auth-url', authenticateToken, getAuthUrl);

// Handle OAuth2 callback: just redirect to frontend
router.get('/callback', handleCallbackAndRedirect);

// Finish OAuth2: exchange code, needs JWT
router.post('/finish', authenticateToken, finishOAuth);

// Refresh access token
router.post('/refresh', authenticateToken, refreshToken);

// Get user's YouTube authorization status
router.get('/status', authenticateToken, getAuthStatus);

// Revoke YouTube authorization
router.delete('/revoke', authenticateToken, revokeAuth);

module.exports = router; 