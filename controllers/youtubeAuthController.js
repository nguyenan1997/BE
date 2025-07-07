const { generateAuthUrl, exchangeCodeForTokens, refreshAccessToken } = require('../config/youtube');
const { GoogleAccessToken } = require('../models');
const jwt = require('jsonwebtoken');
const { syncYouTubeChannelData } = require('../services/youtubeSyncService');
const axios = require('axios');
require('dotenv').config();
const { getToken } = require('../utils/tokenStore'); // Thêm dòng này ở đầu file nếu chưa có

/**
 * @swagger
 * /api/youtube-auth/auth-url:
 *   post:
 *     summary: Lấy URL xác thực OAuth2 YouTube
 *     tags: [YouTube OAuth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: URL xác thực
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 authUrl:
 *                   type: string
 *                   example: "https://accounts.google.com/o/oauth2/auth?..."
 *                 message:
 *                   type: string
 *                   example: "Authorization URL generated successfully"
 *       401:
 *         description: Unauthorized
 */
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
    const tokenRecord = await GoogleAccessToken.findOne({
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

/**
 * @swagger
 * /api/youtube-auth/status:
 *   get:
 *     summary: Lấy trạng thái xác thực YouTube của user
 *     tags: [YouTube OAuth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Trạng thái xác thực
 */
// Get user's YouTube authorization status
const getAuthStatus = async (req, res) => {
  try {
    const userId = req.currentUser.userId;

    const tokenRecord = await GoogleAccessToken.findOne({
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

/**
 * @swagger
 * /api/youtube-auth/revoke:
 *   post:
 *     summary: Thu hồi quyền truy cập YouTube
 *     tags: [YouTube OAuth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Thu hồi thành công
 */
// Revoke YouTube authorization
const revokeAuth = async (req, res) => {
  try {
    const userId = req.currentUser.userId;

    // Deactivate all tokens for user
    await GoogleAccessToken.update(
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
  const frontendUrl = process.env.FRONTEND_URL;
  const frontEndPort = process.env.FRONTEND_PORT;
  res.redirect(`${frontendUrl}:${frontEndPort}/oauth-success?code=${code}`);
};

/**
 * @swagger
 * /api/youtube-auth/finish:
 *   post:
 *     summary: Hoàn tất xác thực OAuth2, lưu token và đồng bộ kênh (frontend gọi)
 *     tags: [YouTube OAuth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Hoàn tất xác thực và đồng bộ kênh thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "YouTube authorization & sync successful"
 *                 syncResult:
 *                   type: object
 *                   description: Sync result details
 *       400:
 *         description: Lỗi xác thực hoặc không tìm thấy kênh
 *       401:
 *         description: Thiếu userId từ JWT
 */
// Xử lý thực sự: nhận code từ frontend, userId từ JWT
const finishOAuth = async (req, res) => {
  try {
    const { code } = req.body;
    // Lấy userId từ JWT (hỗ trợ cả hash và JWT gốc)
    // 1. Lấy token từ header Authorization (Bearer <token>)
    let token = req.headers?.authorization?.split(' ')[1];
    let userId = null;
    if (token) {
      try {
        // 2. Lấy JWT thật từ token đã hash
        const { originalToken = token } = (await getToken(token)) || {};
        // 3. Kiểm tra định dạng JWT (phải có 3 phần, phân tách bởi dấu chấm)
        if (!originalToken.includes('.') || originalToken.split('.').length !== 3)
          return res.status(401).json({ success: false, error: 'Invalid token format' });
        // 4. Verify JWT và lấy userId
        userId = jwt.verify(originalToken, process.env.JWT_SECRET).userId;
      } catch (e) {
        // 5. Nếu lỗi, trả về thông báo lỗi rõ ràng
        return res.status(401).json({ success: false, error: 'Invalid or malformed JWT token', details: e.message });
      }
    }
    if (!userId) return res.status(401).json({ success: false, error: 'Missing userId from JWT' });

    // Đổi code lấy token
    const result = await exchangeCodeForTokens(code);
    if (!result.success) return res.status(400).json({ success: false, error: result.error });

    // Lấy email user từ access token
    let userEmail = null;
    try {
      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${result.tokens.access_token}` }
      });

      userEmail = userInfoRes.data.email || null;
    } catch (e) {
      console.log("Error get email===================>", e);
      userEmail = null;
    }

    // Lấy channel_id của user hiện tại
    
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
      expiresAt: result.tokens.expiry_date,
      channelEmail: userEmail
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