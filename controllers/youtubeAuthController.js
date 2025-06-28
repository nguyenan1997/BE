const { generateAuthUrl, exchangeCodeForTokens, refreshAccessToken } = require('../config/youtube');
const { AccessToken, YouTubeChannel } = require('../models');
const jwt = require('jsonwebtoken');

// Generate OAuth2 authorization URL
const getAuthUrl = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Generate state parameter to include user ID
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    
    // Generate authorization URL
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

// Handle OAuth2 callback
const handleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Authorization failed',
        error: error
      });
    }
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    // Decode state parameter to get user ID
    let userId;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid state parameter'
      });
    }

    // Exchange authorization code for tokens
    const tokenResult = await exchangeCodeForTokens(code);
    
    if (!tokenResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to exchange code for tokens',
        error: tokenResult.error
      });
    }

    const { tokens } = tokenResult;

    // Lấy channel_id từ YouTube API
    let channelId = null;
    try {
      const axios = require('axios');
      const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'id,snippet', mine: true },
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (channelRes.data.items && channelRes.data.items.length > 0) {
        channelId = channelRes.data.items[0].id;
        console.log("Channel ID: ", channelId);
        // Lấy thêm thông tin channel
        const snippet = channelRes.data.items[0].snippet;
        // Tìm hoặc tạo YouTubeChannel
        let channelRecord = await YouTubeChannel.findOne({ where: { channel_id: channelId } });
        if (!channelRecord) {
          channelRecord = await YouTubeChannel.create({
            channel_id: channelId,
            userId: userId,
            channel_title: snippet?.title || '',
            channel_description: snippet?.description || '',
            channel_custom_url: snippet?.customUrl || null,
            channel_country: snippet?.country || null,
            channel_thumbnail_url: snippet?.thumbnails?.default?.url || null,
            channel_creation_date: snippet?.publishedAt || null,
            is_verified: null,
            is_monitized: null
          });
        }
        // Lấy UUID nội bộ
        channelId = channelRecord.id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Failed to fetch channel_id from YouTube API'
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch channel_id from YouTube API',
        error: err.message
      });
    }

    // Check if user already has an access token
    const existingToken = await AccessToken.findOne({
      where: { user_id: userId, is_active: true, channel_id: channelId }
    });

    if (existingToken) {
      // Update existing token
      await existingToken.update({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        is_active: true
      });
    } else {
      // Create new token record
      await AccessToken.create({
        user_id: userId,
        channel_id: channelId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        is_active: true
      });
    }

    // Generate JWT token for frontend
    const jwtToken = jwt.sign(
      { userId: userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'YouTube authorization successful',
      token: jwtToken,
      hasAnalyticsAccess: tokens.scope.includes('yt-analytics-monetary.readonly')
    });
    
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete authorization',
      error: error.message
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

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
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

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
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

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

module.exports = {
  getAuthUrl,
  handleCallback,
  refreshToken,
  getAuthStatus,
  revokeAuth
}; 