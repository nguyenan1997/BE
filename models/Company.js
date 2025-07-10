const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'companies',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

const UserPosition = sequelize.define('UserPosition', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  position: {
    type: DataTypes.ENUM('manager', 'employee'),
    allowNull: false
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  }
}, {
  tableName: 'user_position',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Company;
module.exports.UserPosition = UserPosition; 