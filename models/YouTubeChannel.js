const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const YouTubeChannel = sequelize.define('YouTubeChannel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  channelName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  subscriberCount: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  totalViews: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estimatedRevenue: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  watchTime: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  views48h: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  views60min: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  recentVideos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of 5 recent videos with views, likes, comments'
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
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  socialLinks: {
    type: DataTypes.JSON,
    allowNull: true
  },
  aiAnalysis: {
    type: DataTypes.JSON,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  originalImageName: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  analysisStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  analysisError: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // warning monetization
  monetizationWarning: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Monetization warning status'
  },
  monetizationWarningReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Monetization warning reason'
  },
  monetizationWarningDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Monetization warning date'
  },
  // warning community guidelines
  communityGuidelinesWarning: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Community guidelines warning status'
  },
  communityGuidelinesWarningReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Community guidelines warning reason'
  },
  communityGuidelinesWarningDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Community guidelines warning date'
  },
  // warning summary
  warnings: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Summary of all warnings with details'
  },
  analyzedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'youtube_channels',
  timestamps: true
});

module.exports = YouTubeChannel; 