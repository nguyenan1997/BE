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
    type: DataTypes.ENUM('copyright', 'community', 'monetization', 'spam', 'security', 'coppa', 'other'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'resolved', 'pending'),
    allowNull: false,
    defaultValue: 'active'
  },
  violation_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  resolved_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'channel_violations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['channel_db_id'] },
    { fields: ['violation_type'] },
    { fields: ['status'] }
  ]
});

module.exports = ChannelViolation; 