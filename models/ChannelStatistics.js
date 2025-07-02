const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChannelStatistics = sequelize.define('ChannelStatistics', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  subscriber_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  view_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  like_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  comment_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  share_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  watch_time_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estimated_revenue: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'channel_statistics',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['channel_db_id', 'date'] }
  ]
});

module.exports = ChannelStatistics; 