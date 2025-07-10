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
}, {
  indexes: [
    {
      fields: ['CanonicalIngredientId'],
      name: 'idx_itc_CanonicalIngredientId'
    },
    {
      fields: ['messyName'],
      name: 'idx_itc_messyName'
    }
  ]
});

module.exports = IngredientToCanonical; 