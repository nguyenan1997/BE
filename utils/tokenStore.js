const crypto = require('crypto');

// Hash JWT token
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Store original tokens (in production, use Redis)
const tokenStore = new Map();

// Add token to store
const addToken = (hashedToken, tokenData) => {
  tokenStore.set(hashedToken, {
    ...tokenData,
    createdAt: new Date()
  });
};

// Get token from store
const getToken = (hashedToken) => {
  return tokenStore.get(hashedToken);
};

// Remove token from store
const removeToken = (hashedToken) => {
  return tokenStore.delete(hashedToken);
};

// Remove all tokens for a user
const removeUserTokens = (userId) => {
  for (const [hashedKey, value] of tokenStore.entries()) {
    if (value.userId === userId) {
      tokenStore.delete(hashedKey);
    }
  }
};

// Get store size (for debugging)
const getStoreSize = () => {
  return tokenStore.size;
};

// Clear all tokens (for testing)
const clearStore = () => {
  tokenStore.clear();
};

module.exports = {
  hashToken,
  tokenStore,
  addToken,
  getToken,
  removeToken,
  removeUserTokens,
  getStoreSize,
  clearStore
}; 