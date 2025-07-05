const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const CanonicalIngredient = sequelize.define('CanonicalIngredient', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  aliases: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  allergens: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  }
});

module.exports = CanonicalIngredient; 