const User = require('./User');
const YouTubeChannel = require('./YouTubeChannel');
const Schedule = require('./Schedule');

// Define relationships
User.hasMany(YouTubeChannel, {
  foreignKey: 'analyzedBy',
  as: 'youtubeChannels'
});

YouTubeChannel.belongsTo(User, {
  foreignKey: 'analyzedBy',
  as: 'analyzer'
});

// Schedule relationships
User.hasMany(Schedule, {
  foreignKey: 'userId',
  as: 'schedules'
});

Schedule.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

YouTubeChannel.hasMany(Schedule, {
  foreignKey: 'channelId',
  as: 'schedules'
});

Schedule.belongsTo(YouTubeChannel, {
  foreignKey: 'channelId',
  as: 'channel'
});

module.exports = {
  User,
  YouTubeChannel,
  Schedule
}; 