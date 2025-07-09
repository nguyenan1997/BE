const { Queue } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

// Kết nối Redis (có thể lấy config từ biến môi trường)
const connection = new IORedis(`${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

// Khởi tạo queue cho đồng bộ dữ liệu
const syncQueue = new Queue('syncQueue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true
  }
});

module.exports = syncQueue; 