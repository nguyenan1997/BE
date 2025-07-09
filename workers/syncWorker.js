const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { syncYouTubeChannelData } = require('../services/youtubeSyncService');
const { io: ioClient } = require('socket.io-client');

const connection = new IORedis(`${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`, {
  maxRetriesPerRequest: null
});

// Kết nối tới Socket.IO server
const SOCKET_URL = `${process.env.SOCKET_URL}:${process.env.SOCKET_PORT}`;
const socket = ioClient(SOCKET_URL, { transports: ['websocket'] });

// Worker lắng nghe queue 'syncQueue'
const worker = new Worker('syncQueue', async job => {
  const { channelDbId } = job.data;
  socket.emit('job-status', {
    jobId: job.id,
    channelDbId,
    status: 'processing',
    message: 'Synchronizing data...'
  });
  try {
    const result = await syncYouTubeChannelData({ ...job.data, jobId: job.id });
    socket.emit('job-status', {
      jobId: job.id,
      channelDbId,
      status: 'success',
      message: 'Synchronization successful!',
      result
    });
    return result;
  } catch (error) {
    socket.emit('job-status', {
      jobId: job.id,
      channelDbId,
      status: 'failed',
      message: error.message
    });
    throw error;
  }
}, { connection });

worker.on('completed', job => {
  console.log(`Job ${job.id} completed!`);
});
worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
}); 