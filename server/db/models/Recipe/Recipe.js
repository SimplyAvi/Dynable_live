// models/Recipe.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../database');
const RecipeIngredient = require('./RecipeIngredient');

const Recipe = sequelize.define('Recipe', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  directions: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Define one-to-many relationship
Recipe.hasMany(RecipeIngredient, { onDelete: 'CASCADE' });
RecipeIngredient.belongsTo(Recipe);

module.exports = Recipe;
