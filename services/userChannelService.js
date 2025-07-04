const { UserChannel, YouTubeChannel } = require('../models');

const getUserChannels = async (userId) => {
  // Lấy danh sách channel_db_id mà user quản lý
  const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
  const channelDbIds = links.map(link => link.channel_db_id);
  // Lấy thông tin chi tiết các channel
  return await YouTubeChannel.findAll({ where: { id: channelDbIds } });
};

module.exports = {
  getUserChannels,
}; 