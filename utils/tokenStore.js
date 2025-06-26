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
  return tokenStore.get(hashedToken);
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

module.exports = {
  hashToken,
  addToken,
  getToken,
  removeToken,
  removeUserTokens,
  getStoreSize,
  clearStore
}; 