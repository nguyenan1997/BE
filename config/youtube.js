const { google } = require('googleapis');

// YouTube OAuth2 configuration
const youtubeConfig = {
  clientId: process.env.YOUTUBE_CLIENT_ID,
  clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
  redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/auth/youtube/callback',

  // Scopes needed for YouTube Analytics API (revenue data)
  scopes: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/yt-analytics-monetary.readonly'
  ]
};

// Create OAuth2 client
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    youtubeConfig.clientId,
    youtubeConfig.clientSecret,
    youtubeConfig.redirectUri
  );
};

// Generate authorization URL
const generateAuthUrl = (state = '') => {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: youtubeConfig.scopes,
    prompt: 'consent', // Force consent screen to get refresh token
    state: state
  });
};

// Exchange authorization code for tokens
const exchangeCodeForTokens = async (code) => {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    return {
      success: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      }
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Refresh access token
const refreshAccessToken = async (refreshToken) => {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      success: true,
      tokens: {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken,
        scope: credentials.scope,
        token_type: credentials.token_type,
        expiry_date: credentials.expiry_date
      }
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create YouTube API client with access token
const createYouTubeClient = (accessToken) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.youtube({
    version: 'v3',
    auth: oauth2Client
  });
};

// Create YouTube Analytics API client with access token
const createYouTubeAnalyticsClient = (accessToken) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.youtubeAnalytics({
    version: 'v2',
    auth: oauth2Client
  });
};

module.exports = {
  youtubeConfig,
  createOAuth2Client,
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  createYouTubeClient,
  createYouTubeAnalyticsClient
}; 