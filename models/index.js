const User = require('./User');
const YouTubeChannel = require('./YouTubeChannel');
const ChannelStatistics = require('./ChannelStatistics');
const ChannelViolation = require('./ChannelViolation');
const Video = require('./Video');
const VideoStatistics = require('./VideoStatistics');
const AccessToken = require('./AccessToken');
const UserSchedule = require('./UserSchedule');

// User 1-n YouTubeChannel
User.hasMany(YouTubeChannel, {
  foreignKey: 'user_id',
  as: 'youtube_channels'
});
YouTubeChannel.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User 1-n AccessToken
User.hasMany(AccessToken, {
  foreignKey: 'user_id',
  as: 'access_tokens'
});
AccessToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User 1-1 UserSchedule
User.hasOne(UserSchedule, {
  foreignKey: 'user_id',
  as: 'user_schedule'
});
UserSchedule.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// YouTubeChannel 1-n ChannelStatistics
YouTubeChannel.hasMany(ChannelStatistics, {
  foreignKey: 'channel_id',
  as: 'channel_statistics'
});
ChannelStatistics.belongsTo(YouTubeChannel, {
  foreignKey: 'channel_id',
  as: 'youtube_channel'
});

// YouTubeChannel 1-n ChannelViolation
YouTubeChannel.hasMany(ChannelViolation, {
  foreignKey: 'channel_id',
  as: 'channel_violations'
});
ChannelViolation.belongsTo(YouTubeChannel, {
  foreignKey: 'channel_id',
  as: 'youtube_channel'
});

// YouTubeChannel 1-n Video
YouTubeChannel.hasMany(Video, {
  foreignKey: 'channel_id',
  as: 'videos'
});
Video.belongsTo(YouTubeChannel, {
  foreignKey: 'channel_id',
  as: 'youtube_channel'
});

// YouTubeChannel 1-1 AccessToken (nếu cần)
YouTubeChannel.hasOne(AccessToken, {
  foreignKey: 'channel_db_id',
  as: 'access_token'
});
AccessToken.belongsTo(YouTubeChannel, {
  foreignKey: 'channel_db_id',
  as: 'youtube_channel'
});

// Video 1-n VideoStatistics
Video.hasMany(VideoStatistics, {
  foreignKey: 'video_id',
  as: 'video_statistics'
});
VideoStatistics.belongsTo(Video, {
  foreignKey: 'video_id',
  as: 'video'
});

module.exports = {
  User,
  YouTubeChannel,
  ChannelStatistics,
  ChannelViolation,
  Video,
  VideoStatistics,
  AccessToken,
  UserSchedule
}; 