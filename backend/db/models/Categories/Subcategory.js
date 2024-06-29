const { DataTypes } = require('sequelize');
const sequelize = require('../../database');

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
    }
  }, {
    tableName: 'subcategories'
  });

module.exports = Subcategory