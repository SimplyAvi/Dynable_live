const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const CanonicalIngredient = require('./CanonicalIngredient');

const IngredientToCanonical = sequelize.define('IngredientToCanonical', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  messyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  CanonicalIngredientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  confidence: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'confident',
    validate: {
      isIn: [['confident', 'suggested', 'low']]
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