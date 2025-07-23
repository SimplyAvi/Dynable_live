const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const IngredientCategorizedNutrientDerivation = sequelize.define('IngredientCategorizedNutrientDerivation', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  code: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
});

module.exports = IngredientCategorizedNutrientDerivation;
