const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VideoStatistics = sequelize.define('VideoStatistics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  video_db_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'videos',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
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
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'video_statistics',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['video_db_id', 'date'] }
  ]
});

module.exports = VideoStatistics; 