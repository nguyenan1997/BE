const User = require('./User');
const YouTubeChannel = require('./YouTubeChannel');

// Define relationships
User.hasMany(YouTubeChannel, {
  foreignKey: 'analyzedBy',
  as: 'youtubeChannels'
});

YouTubeChannel.belongsTo(User, {
  foreignKey: 'analyzedBy',
  as: 'analyzer'
});

module.exports = {
  User,
  YouTubeChannel
}; 