const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const FoodAttribute = sequelize.define('FoodAttribute', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  // Add other properties as needed, matching your Supabase columns
  foodId: { type: DataTypes.INTEGER }
}, {
  tableName: 'FoodAttributes'
});

module.exports = FoodAttribute;
