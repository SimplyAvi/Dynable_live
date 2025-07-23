const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const IngredientToCanonical = sequelize.define('IngredientToCanonical', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  messyName: { type: DataTypes.STRING, allowNull: false },
  CanonicalIngredientId: { type: DataTypes.INTEGER, allowNull: false },
  confidence: { type: DataTypes.STRING, allowNull: true, defaultValue: 'confident' },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'IngredientToCanonicals',
  timestamps: true
});

module.exports = IngredientToCanonical; 