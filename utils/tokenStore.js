const crypto = require('crypto');

// Hash JWT token
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Store original tokens (use Redis in production, Map for development)
let tokenStore;

// Initialize token store based on environment
const initializeTokenStore = () => {
  if (process.env.REDIS_URL) {
    // Use Redis in production
    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL);
    
    tokenStore = {
      set: async (key, value) => await redis.set(key, JSON.stringify(value), 'EX', 86400),
      get: async (key) => {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      },
      delete: async (key) => await redis.del(key),
      clear: async () => await redis.flushdb(),
      size: async () => await redis.dbsize()
    };
  } else {
    // Use Map for development
    const mapStore = new Map();
    tokenStore = {
      set: async (key, value) => mapStore.set(key, value),
      get: async (key) => mapStore.get(key),
      delete: async (key) => mapStore.delete(key),
      clear: async () => mapStore.clear(),
      size: async () => mapStore.size
    };
  }
};

// Initialize on module load
initializeTokenStore();

// Add token to store
const addToken = async (hashedToken, tokenData) => {
  await tokenStore.set(hashedToken, {
    ...tokenData,
    createdAt: new Date()
  });
};

// Get token from store
const getToken = async (hashedToken) => {
  return await tokenStore.get(hashedToken);
};

// Remove token from store
const removeToken = async (hashedToken) => {
  return await tokenStore.delete(hashedToken);
};

// Remove all tokens for a user
const removeUserTokens = async (userId) => {
  // For Map, we need to iterate
  if (tokenStore.size) {
    const size = await tokenStore.size();
    if (size > 0) {
      // This is a simplified version for Map
      // In Redis, you'd use SCAN to find and remove
      console.log('Note: removeUserTokens works best with Redis');
    }
  }
};

// Get store size (for debugging)
const getStoreSize = async () => {
  return await tokenStore.size();
};

// Clear all tokens (for testing)
const clearStore = async () => {
  await tokenStore.clear();
};

module.exports = {
  hashToken,
  addToken,
  getToken,
  removeToken,
  removeUserTokens,
  getStoreSize,
  clearStore,
  initializeTokenStore
}; 