const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const FoodNutrient = sequelize.define('FoodNutrient', {
  type: { type: DataTypes.STRING },
  id: { type: DataTypes.INTEGER, primaryKey: true },
  nutrientId: { type: DataTypes.INTEGER },
  foodNutrientDerivationId: { type: DataTypes.INTEGER },
  foodNutrientSourceId: { type: DataTypes.INTEGER },
  amount: { type: DataTypes.FLOAT },

  // Foreign Keys
  foodId: { type: DataTypes.INTEGER },
});

module.exports = FoodNutrient;
