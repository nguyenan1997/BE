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
    comment: 'Có cảnh báo kiếm tiền hay không'
  },
  monetizationWarningReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Nguyên nhân cảnh báo kiếm tiền'
  },
  monetizationWarningDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Ngày nhận cảnh báo kiếm tiền'
  },
  // warning community guidelines
  communityGuidelinesWarning: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Có cảnh báo vi phạm cộng đồng hay không'
  },
  communityGuidelinesWarningReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Nguyên nhân cảnh báo vi phạm cộng đồng'
  },
  communityGuidelinesWarningDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Ngày nhận cảnh báo vi phạm cộng đồng'
  },
  // warning summary
  warnings: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Tổng hợp tất cả cảnh báo với chi tiết'
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