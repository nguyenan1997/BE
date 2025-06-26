const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChannelAnalysis = sequelize.define('ChannelAnalysis', {
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
  analysisType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'analysis_type'
  },
  analysisData: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'analysis_data'
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    }
  },
  analyzedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'analyzed_at'
  },
  isLatest: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_latest'
  }
}, {
  tableName: 'channel_analyses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['channel_id']
    },
    {
      fields: ['analysis_type']
    },
    {
      fields: ['analyzed_at']
    },
    {
      fields: ['is_latest']
    }
  ]
});

module.exports = ChannelAnalysis; 