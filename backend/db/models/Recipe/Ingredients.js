// models/Ingredient.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../database');

const Ingredient = sequelize.define('Ingredient', {
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  quantity: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Ingredient;
