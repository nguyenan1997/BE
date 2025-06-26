# Security Documentation

## 🔒 Hashed Token Security

### Overview
This application uses **hashed tokens** for enhanced security. Instead of sending the original JWT token to the frontend, we hash it and store the original token securely on the server.

### How It Works

1. **Login Process:**
   - User logs in with credentials
   - Server generates original JWT token
   - Server hashes the token using SHA-256
   - Server stores original token in Redis/Map with hashed token as key
   - Server returns hashed token to frontend

2. **API Requests:**
   - Frontend sends hashed token in Authorization header
   - Server looks up original token using hashed token
   - Server verifies original JWT token
   - Server processes request

3. **Security Benefits:**
   - Original JWT token never leaves server
   - Even if hashed token is intercepted, it's useless without server storage
   - Server can invalidate tokens by removing from storage
   - Supports token blacklisting for logout

### Storage Options

#### Development (Map)
- Uses in-memory Map
- Data lost on server restart
- Good for development/testing

#### Production (Redis)
- Uses Redis for persistent storage
- Data survives server restarts
- Automatic expiration (24 hours)
- Scalable across multiple server instances

### Environment Configuration

```bash
# Development (.env)
REDIS_URL=redis://localhost:6379

# Production (.env) - Examples
# Redis Cloud
REDIS_URL=redis://username:password@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345

# AWS ElastiCache
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379

# Google Cloud Memorystore
REDIS_HOST=10.0.0.1
REDIS_PORT=6379

# Azure Cache for Redis
REDIS_URL=redis://username:password@your-cache.redis.cache.windows.net:6380

# For Map (Development)
# No REDIS_URL = uses Map
```

### Token Lifecycle

1. **Creation:** Login → Hash → Store → Return hashed
2. **Usage:** Frontend → Hashed token → Server lookup → Verify original
3. **Refresh:** Generate new token → Hash → Store → Return new hashed
4. **Logout:** Remove from storage → Token becomes invalid

### Security Best Practices

1. **Use Redis in Production:** Ensures token persistence
2. **Set Token Expiry:** JWT tokens expire automatically
3. **Implement Logout:** Remove tokens from storage
4. **Rate Limiting:** Prevent brute force attacks
5. **HTTPS Only:** Always use HTTPS in production

### API Usage

```javascript
// Frontend sends hashed token
const response = await fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${hashedToken}`
  }
});

// Server automatically handles token lookup and verification
```

### Migration from Plain JWT

The system supports both hashed and original tokens for backward compatibility:
- If hashed token found → use stored original token
- If hashed token not found → try as original token
- Gradually migrate frontend to use hashed tokens

### Monitoring

```javascript
// Check token store size
const size = await getStoreSize();
console.log(`Active tokens: ${size}`);

// Clear all tokens (for testing)
await clearStore();
``` 