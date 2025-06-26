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
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Tên lịch đặt'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mô tả lịch đặt'
  },
  cronExpression: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'cron_expression',
    comment: 'Biểu thức cron để định lịch'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Trạng thái hoạt động của lịch'
  },
  lastRunAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_run_at',
    comment: 'Thời gian chạy lần cuối'
  },
  nextRunAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'next_run_at',
    comment: 'Thời gian chạy tiếp theo'
  },
  runCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'run_count',
    comment: 'Số lần đã chạy'
  },
  maxRuns: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_runs',
    comment: 'Số lần chạy tối đa (null = không giới hạn)'
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Các cài đặt bổ sung cho lịch'
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