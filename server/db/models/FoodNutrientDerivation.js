const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const FoodNutrientDerivation = sequelize.define('FoodNutrientDerivation', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  code: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
});

module.exports = FoodNutrientDerivation;
