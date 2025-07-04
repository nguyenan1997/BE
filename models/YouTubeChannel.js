const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const YouTubeChannel = sequelize.define('YouTubeChannel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  channel_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  channel_title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  channel_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  channel_custom_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  channel_country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  channel_thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  channel_creation_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  is_monitized: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  total_view_count: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  total_subscriber_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'youtube_channels',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['channel_id'] }
  ]
});

module.exports = YouTubeChannel; 