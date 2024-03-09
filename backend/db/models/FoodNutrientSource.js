const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const FoodNutrientSource = sequelize.define('FoodNutrientSource', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  code: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
});

module.exports = FoodNutrientSource;
