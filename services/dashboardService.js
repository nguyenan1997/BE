const { UserChannel, ChannelStatistics, YouTubeChannel } = require('../models');
const { Op } = require('sequelize');

// Tổng view theo ngày
const getTotalViewsOfUserChannels = async (userId, days = 7) => {
  const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
  const channelDbIds = links.map(link => link.channel_db_id);
  if (!channelDbIds.length) return [];
  // Lấy nhiều bản ghi nhất có thể, group lại sau
  const stats = await ChannelStatistics.findAll({
    where: { channel_db_id: channelDbIds },
    order: [['date', 'DESC']],
    limit: days * channelDbIds.length
  });
  // Group theo ngày, sum view và sub
  const grouped = {};
  for (const row of stats) {
    if (!grouped[row.date]) grouped[row.date] = { total_view: 0, total_subscriber: 0 };
    grouped[row.date].total_view += row.view_count || 0;
    grouped[row.date].total_subscriber += row.subscriber_count || 0;
  }
  return Object.entries(grouped)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);
};

// Tổng revenue theo ngày
const getTotalRevenueOfUserChannels = async (userId, days = 7) => {
  const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
  const channelDbIds = links.map(link => link.channel_db_id);
  if (!channelDbIds.length) return [];
  const stats = await ChannelStatistics.findAll({
    where: { channel_db_id: channelDbIds },
    order: [['date', 'DESC']],
    limit: days * channelDbIds.length
  });
  const grouped = {};
  for (const row of stats) {
    if (!grouped[row.date]) grouped[row.date] = 0;
    grouped[row.date] += row.estimated_revenue || 0;
  }
  return Object.entries(grouped)
    .map(([date, total_revenue]) => ({ date, total_revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);
};

// Kênh mới nhất
const getRecentChannelsOfUser = async (userId, limit = 6) => {
  const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
  const channelDbIds = links.map(link => link.channel_db_id);
  if (!channelDbIds.length) return [];
  return await YouTubeChannel.findAll({
    where: { id: channelDbIds },
    order: [['created_at', 'DESC']],
    limit
  });
};

module.exports = {
  getTotalViewsOfUserChannels,
  getTotalRevenueOfUserChannels,
  getRecentChannelsOfUser
}; 