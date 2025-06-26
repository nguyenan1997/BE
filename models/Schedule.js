const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cronExpression: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'cron_expression'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastRunAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_run_at'
  },
  nextRunAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'next_run_at'
  },
  runCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'run_count'
  },
  maxRuns: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_runs'
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'schedules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['channel_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['next_run_at']
    }
  ]
});

module.exports = Schedule; 