const { UserChannel, YouTubeChannel, ChannelStatistics, Video, ChannelViolation, YoutubeHistoryLogs } = require('../models');
const { Op } = require('sequelize');

const getUserChannels = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const User = require('../models/User');
  const user = await User.findByPk(userId);

  let channelDbIds = [];
  if (user.role === 'superadmin') {
    // Lấy tất cả channel
    const allChannels = await YouTubeChannel.findAll({ attributes: ['id'] });
    channelDbIds = allChannels.map(c => c.id);
  } else if (user.role === 'admin') {
    // Lấy tất cả channel trừ của superadmin
    // Tìm các channel mà owner không phải superadmin
    const ownerLinks = await UserChannel.findAll({ where: { is_owner: true }, attributes: ['channel_db_id', 'user_id'] });
    const User = require('../models/User');
    const filteredChannelIds = [];
    for (const link of ownerLinks) {
      const owner = await User.findByPk(link.user_id);
      if (owner && owner.role !== 'superadmin') {
        filteredChannelIds.push(link.channel_db_id);
      }
    }
    channelDbIds = filteredChannelIds;
  } else {
    // partner_company, employee_partner: chỉ lấy channel mình quản lý
    const userChannelLinks = await UserChannel.findAll({
      where: { user_id: userId, is_active: true }
    });
    channelDbIds = userChannelLinks.map(link => link.channel_db_id);
  }

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
  // Lấy user và userChannel
  const User = require('../models/User');
  const user = await User.findByPk(userId);
  const userChannel = await UserChannel.findOne({
    where: { channel_db_id: channelDbId, user_id: userId, is_active: true }
  });

  if (!user) throw new Error('User not found');

  if (user.role === 'superadmin') {
    // superadmin xóa mọi channel
  } else if (user.role === 'admin') {
    // admin không xóa channel của superadmin
    const ownerUserChannel = await UserChannel.findOne({ where: { channel_db_id: channelDbId, is_owner: true } });
    if (ownerUserChannel) {
      const ownerUser = await User.findByPk(ownerUserChannel.user_id);
      if (ownerUser && ownerUser.role === 'superadmin') {
        throw new Error('You do not have permission to delete this channel');
      }
    }
  } else if (user.role === 'partner_company' || user.role === 'employee_partner') {
    if (!userChannel || !userChannel.is_owner) {
      throw new Error('You do not have permission to delete this channel');
    }
  } else {
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

/**
 * Lấy thống kê 7 ngày cho 1 channel cụ thể
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
 * Tìm kiếm channel theo từ khóa
 * @param {string} userId
 * @param {string} searchTerm
 * @param {number} page
 * @param {number} limit
 */
const searchChannels = async (userId, searchTerm, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const User = require('../models/User');
  const user = await User.findByPk(userId);

  let channelDbIds = [];
  if (user.role === 'superadmin') {
    // Tìm mọi channel
    const allChannels = await YouTubeChannel.findAll({ attributes: ['id'] });
    channelDbIds = allChannels.map(c => c.id);
  } else if (user.role === 'admin') {
    // Tìm mọi channel trừ của superadmin
    const ownerLinks = await UserChannel.findAll({ where: { is_owner: true }, attributes: ['channel_db_id', 'user_id'] });
    const filteredChannelIds = [];
    for (const link of ownerLinks) {
      const owner = await User.findByPk(link.user_id);
      if (owner && owner.role !== 'superadmin') {
        filteredChannelIds.push(link.channel_db_id);
      }
    }
    channelDbIds = filteredChannelIds;
  } else {
    // partner_company, employee_partner: chỉ tìm kiếm channel mình quản lý
    const userChannelLinks = await UserChannel.findAll({
      where: { user_id: userId, is_active: true }
    });
    channelDbIds = userChannelLinks.map(link => link.channel_db_id);
  }

  if (!channelDbIds.length) {
    return {
      total: 0,
      page,
      limit,
      channels: []
    };
  }

  // Tìm kiếm channel theo từ khóa
  const { count, rows: channelRows } = await YouTubeChannel.findAndCountAll({
    where: {
      id: channelDbIds,
      [Op.or]: [{ channel_title: { [Op.iLike]: `%${searchTerm}%` } }]
    },
    offset,
    limit,
    order: [['channel_title', 'ASC']]
  });
  
  // Lấy tổng doanh thu của các channel tìm được
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
  
  // Gắn trường total_revenue_recent_days vào từng channel trả về
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