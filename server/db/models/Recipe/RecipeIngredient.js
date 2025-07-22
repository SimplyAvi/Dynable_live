// models/Recipe/RecipeIngredient.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../database');

const RecipeIngredient = sequelize.define('RecipeIngredient', {
  quantity: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  RecipeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'RecipeIngredients',
  timestamps: false
});

module.exports = RecipeIngredient;
