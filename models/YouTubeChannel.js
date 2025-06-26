const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const YouTubeChannel = sequelize.define('YouTubeChannel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  channelName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  joinDate: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'join_date'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'image_url'
  },
  originalImageName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'original_image_name'
  },
  socialLinks: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'social_links'
  },
  analysisStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
    field: 'analysis_status'
  },
  analysisError: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'analysis_error'
  },
  analyzedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'analyzed_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'youtube_channels',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['analyzed_by']
    },
    {
      fields: ['analysis_status']
    },
    {
      fields: ['channel_name']
    }
  ]
});

module.exports = YouTubeChannel; 