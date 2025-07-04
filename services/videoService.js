const { Video } = require('../models');

const getVideosOfChannel = async (channelDbId) => {
  return await Video.findAll({ where: { channel_db_id: channelDbId } });
};

module.exports = { getVideosOfChannel }; 