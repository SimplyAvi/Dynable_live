const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const CanonicalIngredient = require('./CanonicalIngredient');

const IngredientToCanonical = sequelize.define('IngredientToCanonical', {
  messyName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  CanonicalIngredientId: {
    type: DataTypes.INTEGER,
    references: {
      model: CanonicalIngredient,
      key: 'id'
    }
  }
});

module.exports = IngredientToCanonical; 