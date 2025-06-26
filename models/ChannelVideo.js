const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChannelVideo = sequelize.define('ChannelVideo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  channelId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'channel_id',
    references: {
      model: 'youtube_channels',
      key: 'id'
    }
  },
  videoId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'video_id'
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnailUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'thumbnail_url'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'published_at'
  },
  duration: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  viewCount: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'view_count'
  },
  likeCount: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'like_count'
  },
  commentCount: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'comment_count'
  },
  isRecent: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_recent'
  },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'recorded_at'
  }
}, {
  tableName: 'channel_videos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['channel_id']
    },
    {
      fields: ['video_id']
    },
    {
      fields: ['published_at']
    },
    {
      fields: ['is_recent']
    }
  ]
});

module.exports = ChannelVideo; 