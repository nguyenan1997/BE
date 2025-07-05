const { UserChannel, YouTubeChannel } = require('../models');

const getUserChannels = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  // Lấy danh sách channel_db_id mà user quản lý
  const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
  const channelDbIds = links.map(link => link.channel_db_id);
  // Lấy thông tin chi tiết các channel, phân trang
  const { count, rows } = await YouTubeChannel.findAndCountAll({
    where: { id: channelDbIds },
    offset,
    limit
  });
  return {
    total: count,
    page,
    limit,
    channels: rows
  };
};

module.exports = {
  getUserChannels,
}; 