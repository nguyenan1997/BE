const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const UserChannel = sequelize.define('UserChannel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  channel_db_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  is_owner: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'user_channel',
  underscored: true,
  timestamps: true,
});

module.exports = UserChannel; 