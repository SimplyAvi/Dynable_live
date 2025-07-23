const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const FoodNutrient = sequelize.define('FoodNutrient', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  type: DataTypes.STRING,
  nutrientId: DataTypes.INTEGER,
  foodNutrientDerivationId: DataTypes.INTEGER,
  foodNutrientSourceId: DataTypes.INTEGER,
  amount: DataTypes.DOUBLE,
  FoodId: DataTypes.INTEGER,   // Only keep FoodId as the foreign key
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'FoodNutrients',
  timestamps: true
});

module.exports = FoodNutrient;
