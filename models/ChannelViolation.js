const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChannelViolation = sequelize.define('ChannelViolation', {
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
  violation_type: {
    type: DataTypes.ENUM('community', 'monetization'),
    allowNull: false
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'resolved'),
    allowNull: false,
    defaultValue: 'active'
  },
  violation_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'channel_violations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['channel_db_id'] },
    { fields: ['violation_type'] },
    { fields: ['status'] }
  ]
});

module.exports = ChannelViolation; 