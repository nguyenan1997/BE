const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChannelStatistics = sequelize.define('ChannelStatistics', {
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
  subscriberCount: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'subscriber_count'
  },
  totalViews: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'total_views'
  },
  estimatedRevenue: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'estimated_revenue'
  },
  watchTime: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'watch_time'
  },
  views48h: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'views_48h'
  },
  views60min: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'views_60min'
  },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'recorded_at'
  }
}, {
  tableName: 'channel_statistics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['channel_id']
    },
    {
      fields: ['recorded_at']
    }
  ]
});

module.exports = ChannelStatistics; 