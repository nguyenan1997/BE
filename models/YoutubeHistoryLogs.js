const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const YoutubeHistoryLogs = sequelize.define('YoutubeHistoryLogs', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_channel_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user_channel',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('success', 'failed'),
    allowNull: false,
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  list_video_new: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  finishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'youtube_history_logs',
  timestamps: true,
});

module.exports = YoutubeHistoryLogs; 