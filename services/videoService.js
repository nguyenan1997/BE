const { Video } = require('../models');
const { VideoStatistics } = require('../models');

const getVideosOfChannel = async (channelDbId) => {
  return await Video.findAll({ where: { channel_db_id: channelDbId } });
};

const fetchVideoStatistics = async (videoDbId) => {
  return await VideoStatistics.findAll({
    where: { video_db_id: videoDbId },
    order: [['date', 'ASC']]
  });
};

module.exports = { getVideosOfChannel, fetchVideoStatistics }; 