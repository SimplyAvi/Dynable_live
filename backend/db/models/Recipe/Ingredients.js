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
  },
  subcategoryID: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Subcategory', // table name
      key: 'SubcategoryID'
    }
  }
});

module.exports = Ingredient;
