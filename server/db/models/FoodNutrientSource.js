const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const IngredientCategorizedNutrientSource = sequelize.define('IngredientCategorizedNutrientSource', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  code: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
});

module.exports = IngredientCategorizedNutrientSource;
