const { UserChannel, YouTubeChannel, ChannelStatistics, Video, ChannelViolation, YoutubeHistoryLogs } = require('../models');
const { Op } = require('sequelize');

const getUserChannels = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  // 1. Lấy danh sách channel_db_id mà user quản lý
  const userChannelLinks = await UserChannel.findAll({
    where: { user_id: userId, is_active: true }
  });
  const channelDbIds = userChannelLinks.map(link => link.channel_db_id);

  // 2. Lấy thông tin chi tiết các channel, phân trang
  const { count, rows: channelRows } = await YouTubeChannel.findAndCountAll({
    where: { id: channelDbIds },
    offset,
    limit
  });

  // 3. Lấy tổng doanh thu của tất cả bản ghi ChannelStatistics cho từng channel trên trang hiện tại
  const currentPageChannelIds = channelRows.map(channel => channel.id);
  const revenueStats = await ChannelStatistics.findAll({
    where: {
      channel_db_id: currentPageChannelIds
    },
    attributes: [
      'channel_db_id',
      [ChannelStatistics.sequelize.fn('sum', ChannelStatistics.sequelize.col('estimated_revenue')), 'total_revenue']
    ],
    group: ['channel_db_id']
  });

  // Tạo map channel_db_id -> tổng doanh thu
  const revenueMap = {};
  for (const stat of revenueStats) {
    revenueMap[stat.channel_db_id] = parseFloat(stat.get('total_revenue')) || 0;
  }

  // 4. Gắn trường total_revenue_recent_days vào từng channel trả về
  const channels = channelRows.map(channel => {
    const channelObj = channel.toJSON();
    channelObj.total_revenue_recent_days = revenueMap[channel.id] || 0;
    return channelObj;
  });

  // 5. Trả về kết quả
  return {
    total: count,
    page,
    limit,
    channels
  };
};

/**
 * Xoá channel và toàn bộ dữ liệu liên quan
 * @param {string} channelDbId
 * @param {string} userId
 * @param {string} userRole
 */
const deleteChannelById = async (channelDbId, userId, userRole) => {
  // Kiểm tra quyền: admin hoặc owner của channel
  const userChannel = await UserChannel.findOne({
    where: { channel_db_id: channelDbId, user_id: userId, is_active: true }
  });
  if (userRole !== 'admin' && (!userChannel || !userChannel.is_owner)) {
    throw new Error('You do not have permission to delete this channel');
  }
  // Xoá dữ liệu liên quan
  await Video.destroy({ where: { channel_db_id: channelDbId } });
  await ChannelStatistics.destroy({ where: { channel_db_id: channelDbId } });
  await ChannelViolation.destroy({ where: { channel_db_id: channelDbId } });
  await YoutubeHistoryLogs.destroy({ where: { channelDbId } });
  await UserChannel.destroy({ where: { channel_db_id: channelDbId } });
  // Xoá channel
  const deleted = await YouTubeChannel.destroy({ where: { id: channelDbId } });
  if (!deleted) throw new Error('No channel found to delete');
  return true;
};

module.exports = {
  getUserChannels,
  deleteChannelById,
}; 