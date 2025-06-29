const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AccessToken = sequelize.define('AccessToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  channel_db_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'youtube_channels',
      key: 'id'
    }
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'access_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['channel_db_id'] }
  ]
});

module.exports = AccessToken; 