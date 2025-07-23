const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Ingredient = require('./Ingredient');

const Substitution = sequelize.define('Substitution', {
  IngredientId: {
    type: DataTypes.INTEGER,
    references: {
      model: Ingredient,
      key: 'id'
    }
  },
  substituteName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Substitution; 