const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChannelWarning = sequelize.define('ChannelWarning', {
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
  warningType: {
    type: DataTypes.ENUM('monetization', 'community_guidelines', 'copyright', 'other'),
    allowNull: false,
    field: 'warning_type'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  status: {
    type: DataTypes.ENUM('unread', 'read', 'processing', 'resolved', 'ignored'),
    defaultValue: 'unread'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of notes added by users'
  },
  warningDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'warning_date'
  },
  resolvedDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resolved_date'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at'
  },
  processedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'processed_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  }
}, {
  tableName: 'channel_warnings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['channel_id']
    },
    {
      fields: ['warning_type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['status']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['channel_id', 'warning_type', 'is_active']
    },
    {
      fields: ['channel_id', 'status']
    }
  ]
});

module.exports = ChannelWarning; 