const { DataTypes } = require('sequelize');
const sequelize = require('../../database');
const Category = require('./Category')

// Define the Subcategory model
const Subcategory = sequelize.define('Subcategory', {
    SubcategoryID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    SubcategoryName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    CategoryID: {
      type: DataTypes.INTEGER,
      references: {
        model: Category,
        key: 'CategoryID'
      }
    },
    pure_ingredient: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_basic_ingredient: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_fresh_produce: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_processed_food: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  })

module.exports = Subcategory