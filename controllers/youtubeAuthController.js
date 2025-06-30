const { generateAuthUrl, exchangeCodeForTokens, refreshAccessToken } = require('../config/youtube');
const { AccessToken, YouTubeChannel } = require('../models');
const jwt = require('jsonwebtoken');
const { syncYouTubeChannelData } = require('../services/youtubeSyncService');

// Generate OAuth2 authorization URL
const getAuthUrl = async (req, res) => {
  try {
    // Mục đích của state là để tránh CSRF
    const state = Math.random().toString(36).substring(2);
    console.log("state", state);
    const authUrl = generateAuthUrl(state);
    res.json({
      success: true,
      authUrl: authUrl,
      message: 'Authorization URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL',
      error: error.message
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const userId = req.currentUser.userId;

    // Get user's refresh token
    const tokenRecord = await AccessToken.findOne({
      where: { user_id: userId, is_active: true }
    });

    if (!tokenRecord || !tokenRecord.refreshToken) {
      return res.status(404).json({
        success: false,
        message: 'No active refresh token found for user'
      });
    }

    // Refresh the access token
    const refreshResult = await refreshAccessToken(tokenRecord.refreshToken);
    
    if (!refreshResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to refresh access token',
        error: refreshResult.error
      });
    }

    const { tokens } = refreshResult;

    // Update token record
    await tokenRecord.update({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || tokenRecord.refreshToken,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    });

    res.json({
      success: true,
      message: 'Access token refreshed successfully',
      hasAnalyticsAccess: tokens.scope.includes('yt-analytics-monetary.readonly')
    });
    
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh access token',
      error: error.message
    });
  }
};

// Get user's YouTube authorization status
const getAuthStatus = async (req, res) => {
  try {
    const userId = req.currentUser.userId;

    const tokenRecord = await AccessToken.findOne({
      where: { user_id: userId, is_active: true }
    });

    if (!tokenRecord) {
      return res.json({
        success: true,
        isAuthorized: false,
        hasAnalyticsAccess: false,
        message: 'User not authorized with YouTube'
      });
    }

    // Check if token is expired
    const isExpired = tokenRecord.expiresAt && new Date() > tokenRecord.expiresAt;
    
    res.json({
      success: true,
      isAuthorized: !isExpired,
      hasAnalyticsAccess: tokenRecord.scope.includes('yt-analytics-monetary.readonly'),
      tokenExpiresAt: tokenRecord.expiresAt,
      isExpired: isExpired,
      message: isExpired ? 'Token expired, needs refresh' : 'User authorized with YouTube'
    });
    
  } catch (error) {
    console.error('Error getting auth status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get authorization status',
      error: error.message
    });
  }
};

// Revoke YouTube authorization
const revokeAuth = async (req, res) => {
  try {
    const userId = req.currentUser.userId;

    // Deactivate all tokens for user
    await AccessToken.update(
      { is_active: false },
      { where: { user_id: userId } }
    );

    res.json({
      success: true,
      message: 'YouTube authorization revoked successfully'
    });
    
  } catch (error) {
    console.error('Error revoking auth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke authorization',
      error: error.message
    });
  }
};

// Callback chỉ redirect về frontend
const handleCallbackAndRedirect = (req, res) => {
  const { code } = req.query;
  console.log("OAuth callback code:", code);
  // Redirect về frontend, truyền code qua query
  res.redirect(`https://localhost:5173/oauth-success?code=${code}`);
};

// Xử lý thực sự: nhận code từ frontend, userId từ JWT
const finishOAuth = async (req, res) => {
  try {
    const { code } = req.body;
    // Lấy userId từ JWT
    let token = null;
    if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') token = parts[1];
    }
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {}
    }
    if (!userId) return res.status(401).json({ success: false, error: 'Missing userId from JWT' });

    // Đổi code lấy token
    const result = await exchangeCodeForTokens(code);
    if (!result.success) return res.status(400).json({ success: false, error: result.error });

    // Lấy channel_id của user hiện tại
    const axios = require('axios');
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'id,snippet',
        mine: true,
        access_token: result.tokens.access_token
      }
    });

    if (!channelRes.data.items || channelRes.data.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No YouTube channel found for this user' 
      });
    }

    const channelId = channelRes.data.items[0].id;
    // Gọi syncYouTubeChannelData và truyền đủ các trường token
    const syncResult = await syncYouTubeChannelData({
      userId,
      channelId,
      accessToken: result.tokens.access_token,
      refreshToken: result.tokens.refresh_token,
      scope: result.tokens.scope,
      tokenType: result.tokens.token_type,
      expiresAt: result.tokens.expiry_date
    });

    return res.json({
      success: true,
      message: 'YouTube authorization & sync successful',
      syncResult
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAuthUrl,
  handleCallbackAndRedirect,
  finishOAuth,
  refreshToken,
  getAuthStatus,
  revokeAuth
}; 