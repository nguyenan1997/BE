const User = require('./User');
const YouTubeChannel = require('./YouTubeChannel');
const Schedule = require('./Schedule');
const ChannelStatistics = require('./ChannelStatistics');
const ChannelWarning = require('./ChannelWarning');
const ChannelVideo = require('./ChannelVideo');
const ChannelAnalysis = require('./ChannelAnalysis');

// User relationships
User.hasMany(YouTubeChannel, {
  foreignKey: 'userId',
  as: 'youtubeChannels'
});

YouTubeChannel.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Schedule, {
  foreignKey: 'userId',
  as: 'schedules'
});

Schedule.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// YouTube Channel relationships
YouTubeChannel.hasMany(Schedule, {
  foreignKey: 'channelId',
  as: 'schedules'
});

Schedule.belongsTo(YouTubeChannel, {
  foreignKey: 'channelId',
  as: 'channel'
});

// Channel Statistics relationships
YouTubeChannel.hasMany(ChannelStatistics, {
  foreignKey: 'channelId',
  as: 'statistics'
});

ChannelStatistics.belongsTo(YouTubeChannel, {
  foreignKey: 'channelId',
  as: 'channel'
});

// Channel Warning relationships
YouTubeChannel.hasMany(ChannelWarning, {
  foreignKey: 'channelId',
  as: 'warnings'
});

ChannelWarning.belongsTo(YouTubeChannel, {
  foreignKey: 'channelId',
  as: 'channel'
});

// Channel Video relationships
YouTubeChannel.hasMany(ChannelVideo, {
  foreignKey: 'channelId',
  as: 'videos'
});

ChannelVideo.belongsTo(YouTubeChannel, {
  foreignKey: 'channelId',
  as: 'channel'
});

// Channel Analysis relationships
YouTubeChannel.hasMany(ChannelAnalysis, {
  foreignKey: 'channelId',
  as: 'analyses'
});

ChannelAnalysis.belongsTo(YouTubeChannel, {
  foreignKey: 'channelId',
  as: 'channel'
});

module.exports = {
  User,
  YouTubeChannel,
  Schedule,
  ChannelStatistics,
  ChannelWarning,
  ChannelVideo,
  ChannelAnalysis
}; 