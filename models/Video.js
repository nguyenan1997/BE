const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  channel_db_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'youtube_channels',
      key: 'id'
    }
  },
  video_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  privacy_status: {
    type: DataTypes.ENUM('public', 'private', 'unlisted'),
    allowNull: true
  }
}, {
  tableName: 'videos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['channel_db_id'] },
    { fields: ['video_id'] },
    { fields: ['published_at'] }
  ]
});

module.exports = Video; 