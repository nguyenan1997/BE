const { UserChannel, YouTubeChannel, ChannelStatistics, Video, ChannelViolation, YoutubeHistoryLogs } = require('../models');
const { Op } = require('sequelize');

const getUserChannels = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  // 1. Get all active channels for the user
  const userChannelLinks = await UserChannel.findAll({
    where: { user_id: userId, is_active: true }
  });
  const channelDbIds = userChannelLinks.map(link => link.channel_db_id);

  // 2. Get channels with pagination
  const { count, rows: channelRows } = await YouTubeChannel.findAndCountAll({
    where: { id: channelDbIds },
    offset,
    limit
  });

  // 3. Get total revenue for each channel in the current page
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

  // Crete a map to store total revenue by channel_db_id
  const revenueMap = {};
  for (const stat of revenueStats) {
    revenueMap[stat.channel_db_id] = parseFloat(stat.get('total_revenue')) || 0;
  }

  // 4. Map channels to include total revenue
  const channels = channelRows.map(channel => {
    const channelObj = channel.toJSON();
    channelObj.total_revenue_recent_days = revenueMap[channel.id] || 0;
    return channelObj;
  });

  // 5. Return the result
  return {
    total: count,
    page,
    limit,
    channels
  };
};

/**
 * Delete channel and all related data
 * @param {string} channelDbId
 * @param {string} userId
 * @param {string} userRole
 */
const deleteChannelById = async (channelDbId, userId, userRole) => {
  // Check permission: admin or channel owner
  const userChannel = await UserChannel.findOne({
    where: { channel_db_id: channelDbId, user_id: userId, is_active: true }
  });
  if (userRole !== 'admin' && (!userChannel || !userChannel.is_owner)) {
    throw new Error('You do not have permission to delete this channel');
  }
  // Delete related data
  await Video.destroy({ where: { channel_db_id: channelDbId } });
  await ChannelStatistics.destroy({ where: { channel_db_id: channelDbId } });
  await ChannelViolation.destroy({ where: { channel_db_id: channelDbId } });
  // Delete logs by user_channel_id
  const userChannels = await UserChannel.findAll({ where: { channel_db_id: channelDbId } });
  const userChannelIds = userChannels.map(uc => uc.id);
  if (userChannelIds.length > 0) {
    await YoutubeHistoryLogs.destroy({ where: { user_channel_id: userChannelIds } });
  }
  await UserChannel.destroy({ where: { channel_db_id: channelDbId } });
  // Delete channel
  const deleted = await YouTubeChannel.destroy({ where: { id: channelDbId } });
  if (!deleted) throw new Error('No channel found to delete');
  return true;
};

/**
 * Get channel statistics for the last N days
 * @param {string} channelDbId
 * @param {number} days
 */
const getChannelStatistics = async (channelDbId, days = 7) => {
  const stats = await ChannelStatistics.findAll({
    where: { channel_db_id: channelDbId },
    order: [['date', 'DESC']],
    limit: days
  });
  
  return stats.map(row => ({
    date: row.date,
    view_count: row.view_count || 0,
    like_count: row.like_count || 0,
    subscriber_count: row.subscriber_count || 0,
    estimated_revenue: row.estimated_revenue || 0,
    comment_count: row.comment_count || 0,
    share_count: row.share_count || 0,
    watch_time_minutes: row.watch_time_minutes || 0
  })).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Search channels by title for a user
 * @param {string} userId
 * @param {string} searchTerm
 * @param {number} page
 * @param {number} limit
 */
const searchChannels = async (userId, searchTerm, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  // Lấy danh sách channel_db_id mà user quản lý
  const userChannelLinks = await UserChannel.findAll({
    where: { user_id: userId, is_active: true }
  });
  const channelDbIds = userChannelLinks.map(link => link.channel_db_id);
  
  if (!channelDbIds.length) {
    return {
      total: 0,
      page,
      limit,
      channels: []
    };
  }
  
  // TSearch channels by title
  const { count, rows: channelRows } = await YouTubeChannel.findAndCountAll({
    where: {
      id: channelDbIds,
      [Op.or]: [{ channel_title: { [Op.iLike]: `%${searchTerm}%` } }]
    },
    offset,
    limit,
    order: [['channel_title', 'ASC']]
  });
  
  // Get total revenue for each channel in the current page
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
  
  // Create a map to store total revenue by channel_db_id
  const revenueMap = {};
  for (const stat of revenueStats) {
    revenueMap[stat.channel_db_id] = parseFloat(stat.get('total_revenue')) || 0;
  }
  
  // Map channels to include total revenue
  const channels = channelRows.map(channel => {
    const channelObj = channel.toJSON();
    channelObj.total_revenue_recent_days = revenueMap[channel.id] || 0;
    return channelObj;
  });
  
  return {
    total: count,
    page,
    limit,
    channels
  };
};

module.exports = {
  getUserChannels,
  deleteChannelById,
  getChannelStatistics,
  searchChannels
}; 