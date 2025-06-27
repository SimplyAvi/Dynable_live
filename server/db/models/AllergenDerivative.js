const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const AllergenDerivative = sequelize.define('AllergenDerivative', {
  allergen: {
    type: DataTypes.STRING,
    allowNull: false
  },
  derivative: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = AllergenDerivative; 