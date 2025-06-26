# Redis Library Comparison

## ioredis vs node-redis

### Basic Connection

#### ioredis
```javascript
const Redis = require('ioredis');

// Development
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'your_password',
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Production (using environment variables)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Production (using Redis URL)
const redis = new Redis(process.env.REDIS_URL);
```

#### node-redis
```javascript
const { createClient } = require('redis');

// Development
const redis = createClient({
  socket: {
    host: 'localhost',
    port: 6379
  },
  password: 'your_password',
  database: 0
});

// Production (using environment variables)
const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD,
  database: process.env.REDIS_DB || 0
});

// Production (using Redis URL)
const redis = createClient({
  url: process.env.REDIS_URL
});

await redis.connect();
```

### Error Handling

#### ioredis
```javascript
const redis = new Redis(process.env.REDIS_URL);

redis.on('error', (err) => {
  console.log('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis ready');
});
```

#### node-redis
```javascript
const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on('error', (err) => {
  console.log('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis ready');
});
```

### Basic Operations

#### ioredis
```javascript
// Set/Get
await redis.set('key', 'value', 'EX', 3600);
const value = await redis.get('key');

// Multiple operations
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
const results = await pipeline.exec();

// Transaction
const multi = redis.multi();
multi.set('key1', 'value1');
multi.set('key2', 'value2');
await multi.exec();
```

#### node-redis
```javascript
// Set/Get
await redis.set('key', 'value', { EX: 3600 });
const value = await redis.get('key');

// Multiple operations
const multi = redis.multi();
multi.set('key1', 'value1');
multi.set('key2', 'value2');
await multi.exec();

// Transaction
const multi = redis.multi();
multi.set('key1', 'value1');
multi.set('key2', 'value2');
await multi.exec();
```

### Cluster Support

#### ioredis
```javascript
const Redis = require('ioredis');

// Development cluster
const cluster = new Redis.Cluster([
  { host: 'localhost', port: 7000 },
  { host: 'localhost', port: 7001 },
  { host: 'localhost', port: 7002 }
]);

// Production cluster (using environment variables)
const cluster = new Redis.Cluster([
  { host: process.env.REDIS_CLUSTER_HOST_1, port: process.env.REDIS_CLUSTER_PORT_1 },
  { host: process.env.REDIS_CLUSTER_HOST_2, port: process.env.REDIS_CLUSTER_PORT_2 },
  { host: process.env.REDIS_CLUSTER_HOST_3, port: process.env.REDIS_CLUSTER_PORT_3 }
]);
```

#### node-redis
```javascript
const { createCluster } = require('redis');

// Development cluster
const cluster = createCluster({
  rootNodes: [
    { socket: { host: 'localhost', port: 7000 } },
    { socket: { host: 'localhost', port: 7001 } },
    { socket: { host: 'localhost', port: 7002 } }
  ]
});

// Production cluster (using environment variables)
const cluster = createCluster({
  rootNodes: [
    { socket: { host: process.env.REDIS_CLUSTER_HOST_1, port: process.env.REDIS_CLUSTER_PORT_1 } },
    { socket: { host: process.env.REDIS_CLUSTER_HOST_2, port: process.env.REDIS_CLUSTER_PORT_2 } },
    { socket: { host: process.env.REDIS_CLUSTER_HOST_3, port: process.env.REDIS_CLUSTER_PORT_3 } }
  ]
});
```

## Environment Configuration

### Development (.env)
```bash
# Local development
REDIS_URL=redis://localhost:6379
# or
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Production (.env)
```bash
# Production (example with Redis Cloud)
REDIS_URL=redis://username:password@redis-host:port

# or separate variables
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0

# For cluster
REDIS_CLUSTER_HOST_1=cluster-node-1.com
REDIS_CLUSTER_PORT_1=7000
REDIS_CLUSTER_HOST_2=cluster-node-2.com
REDIS_CLUSTER_PORT_2=7000
REDIS_CLUSTER_HOST_3=cluster-node-3.com
REDIS_CLUSTER_PORT_3=7000
```

### Cloud Redis Examples

#### Redis Cloud
```bash
REDIS_URL=redis://username:password@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
```

#### AWS ElastiCache
```bash
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Google Cloud Memorystore
```bash
REDIS_HOST=10.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Azure Cache for Redis
```bash
REDIS_URL=redis://username:password@your-cache.redis.cache.windows.net:6380
```

## Why Choose ioredis?

### 1. **Better Performance**
- Connection pooling tự động
- Pipelining hiệu quả hơn
- Memory usage thấp hơn

### 2. **Easier Setup**
- Ít configuration hơn
- Auto-reconnection built-in
- Error handling tốt hơn

### 3. **Production Ready**
- Cluster support hoàn chỉnh
- Sentinel support
- High availability

### 4. **Developer Experience**
- API đơn giản hơn
- TypeScript support tốt
- Documentation đầy đủ

### 5. **Community**
- Nhiều stars trên GitHub
- Active maintenance
- Large community

## Migration Guide

### From node-redis to ioredis

```javascript
// Old (node-redis)
const { createClient } = require('redis');
const redis = createClient({
  url: process.env.REDIS_URL
});
await redis.connect();

// New (ioredis)
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
// No need to connect manually
```

### API Changes

```javascript
// node-redis
await redis.set('key', 'value', { EX: 3600 });

// ioredis
await redis.set('key', 'value', 'EX', 3600);
```

## Conclusion

**ioredis** được chọn vì:
- Performance tốt hơn
- Setup đơn giản hơn
- Production-ready features
- Better developer experience
- Active community support 