const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const FoodAttributeType = sequelize.define('FoodAttributeType', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: { type: DataTypes.STRING },
  // Add other properties as needed
});

module.exports = FoodAttributeType;
