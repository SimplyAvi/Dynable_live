const { DataTypes } = require('sequelize');
const sequelize = require('../../database');

// Define the Category model
const Category = sequelize.define('Category', {
  CategoryID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  CategoryName: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
});

module.exports = Category