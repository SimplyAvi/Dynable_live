const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const IngredientMatchingRule = sequelize.define('IngredientMatchingRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ingredientName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  primaryKeywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  exclusionKeywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  exactMatch: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  strictPhrase: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isBasicIngredient: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = IngredientMatchingRule; 