const User = require('./User');
const YouTubeChannel = require('./YouTubeChannel');
const ChannelStatistics = require('./ChannelStatistics');
const ChannelViolation = require('./ChannelViolation');
const Video = require('./Video');
const VideoStatistics = require('./VideoStatistics');
const GoogleAccessToken = require('./GoogleAccessToken');
const UserSchedule = require('./UserSchedule');
const UserChannel = require('./UserChannel');

// User 1-n UserSchedule
User.hasMany(UserSchedule, {
  foreignKey: 'user_id',
  as: 'user_schedules'
});
UserSchedule.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// YouTubeChannel 1-n ChannelStatistics
YouTubeChannel.hasMany(ChannelStatistics, {
  foreignKey: 'channel_db_id',
  as: 'channel_statistics'
});
ChannelStatistics.belongsTo(YouTubeChannel, {
  foreignKey: 'channel_db_id',
  as: 'youtube_channel'
});

// YouTubeChannel 1-n ChannelViolation
YouTubeChannel.hasMany(ChannelViolation, {
  foreignKey: 'channel_db_id',
  as: 'channel_violations'
});
ChannelViolation.belongsTo(YouTubeChannel, {
  foreignKey: 'channel_db_id',
  as: 'youtube_channel'
});

// YouTubeChannel 1-n Video
YouTubeChannel.hasMany(Video, {
  foreignKey: 'channel_db_id',
  as: 'videos'
});
Video.belongsTo(YouTubeChannel, {
  foreignKey: 'channel_db_id',
  as: 'youtube_channel'
});

// YouTubeChannel 1-1 GoogleAccessToken (nếu cần)
YouTubeChannel.hasOne(GoogleAccessToken, {
  foreignKey: 'channel_db_id',
  as: 'access_token'
});
GoogleAccessToken.belongsTo(YouTubeChannel, {
  foreignKey: 'channel_db_id',
  as: 'youtube_channel'
});

// Video 1-n VideoStatistics
Video.hasMany(VideoStatistics, {
  foreignKey: 'video_db_id',
  as: 'video_statistics'
});
VideoStatistics.belongsTo(Video, {
  foreignKey: 'video_db_id',
  as: 'video'
});

// User 1-n UserChannel (mapping quyền sở hữu/quản lý kênh)
User.hasMany(UserChannel, { foreignKey: 'user_id', as: 'user_channels' });
UserChannel.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
YouTubeChannel.hasMany(UserChannel, { foreignKey: 'channel_db_id', as: 'user_channels' });
UserChannel.belongsTo(YouTubeChannel, { foreignKey: 'channel_db_id', as: 'youtube_channel' });

module.exports = {
  User,
  YouTubeChannel,
  ChannelStatistics,
  ChannelViolation,
  Video,
  VideoStatistics,
  GoogleAccessToken,
  UserSchedule,
  UserChannel
}; 