const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const CanonicalIngredient = require('./CanonicalIngredient');

const Substitution = sequelize.define('Substitution', {
  CanonicalIngredientId: {
    type: DataTypes.INTEGER,
    references: {
      model: CanonicalIngredient,
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