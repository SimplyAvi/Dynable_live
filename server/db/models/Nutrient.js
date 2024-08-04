const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Nutrient = sequelize.define('Nutrient', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  number: { type: DataTypes.STRING },
  name: { type: DataTypes.STRING },
  rank: { type: DataTypes.INTEGER },
  unitName: { type: DataTypes.STRING },
});

module.exports = Nutrient;
