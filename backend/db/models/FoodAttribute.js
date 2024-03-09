const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const FoodAttribute = sequelize.define('FoodAttribute', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  // Add other properties as needed

  // Foreign Key
  foodId: { type: DataTypes.INTEGER },
});

module.exports = FoodAttribute;
