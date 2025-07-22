const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Ingredient = sequelize.define('Ingredient', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
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
}, {
  tableName: 'Ingredients', // Matches your Supabase table
  timestamps: false // Set to true if you have createdAt/updatedAt columns
});

module.exports = Ingredient; 