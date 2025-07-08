const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Kết nối Redis (có thể lấy config từ biến môi trường)
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Khởi tạo queue cho đồng bộ dữ liệu
const syncQueue = new Queue('syncQueue', { connection });

module.exports = syncQueue; 