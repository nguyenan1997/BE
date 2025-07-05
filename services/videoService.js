const { Video } = require('../models');
const { VideoStatistics } = require('../models');
const { Op } = require('sequelize');

const getVideosOfChannel = async (channelDbId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Video.findAndCountAll({
    where: { channel_db_id: channelDbId },
    offset,
    limit
  });
  return {
    total: count,
    page,
    limit,
    videos: rows
  };
};

const fetchVideoStatistics = async (videoDbId, days = 7) => {
  const stats = await VideoStatistics.findAll({
    where: { video_db_id: videoDbId },
    order: [['date', 'DESC']],
    limit: days
  });
  return stats.reverse();
};

module.exports = { getVideosOfChannel, fetchVideoStatistics }; 