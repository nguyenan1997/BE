const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const SharedChannel = sequelize.define('SharedChannel', {
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
  tableName: 'shared_channels',
  underscored: true,
  timestamps: true,
});

module.exports = SharedChannel; 