const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VideoStatistics = sequelize.define('VideoStatistics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  video_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'videos',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATE,
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
  estimated_revenue: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'video_statistics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['video_id'] },
    { fields: ['date'] }
  ]
});

module.exports = VideoStatistics; 