const crypto = require('crypto');

// Hash JWT token
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Simple Map storage for tokens
const tokenStore = new Map();

// Add token to store
const addToken = async (hashedToken, tokenData) => {
  tokenStore.set(hashedToken, {
    ...tokenData,
    createdAt: new Date()
  });
};

// Get token from store
const getToken = async (hashedToken) => {
  const tokenData = tokenStore.get(hashedToken);
  if (!tokenData) return null;
  
  // Check if token is expired (24h)
  const tokenAge = Date.now() - tokenData.createdAt.getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (tokenAge > maxAge) {
    tokenStore.delete(hashedToken);
    return null;
  }
  
  return tokenData;
};

// Remove token from store
const removeToken = async (hashedToken) => {
  return tokenStore.delete(hashedToken);
};

// Remove all tokens for a user
const removeUserTokens = async (userId) => {
  for (const [hashedKey, value] of tokenStore.entries()) {
    if (value.userId === userId) {
      tokenStore.delete(hashedKey);
    }
  }
};

// Get store size (for debugging)
const getStoreSize = async () => {
  return tokenStore.size;
};

// Clear all tokens (for testing)
const clearStore = async () => {
  tokenStore.clear();
};

// Cleanup expired tokens
const cleanupExpiredTokens = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [hashedKey, value] of tokenStore.entries()) {
    const tokenAge = now - value.createdAt.getTime();
    if (tokenAge > maxAge) {
      tokenStore.delete(hashedKey);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = {
  hashToken,
  addToken,
  getToken,
  removeToken,
  removeUserTokens,
  getStoreSize,
  clearStore
}; 