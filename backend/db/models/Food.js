const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Food = sequelize.define('Food', {
  foodClass: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  // modifiedDate: { type: DataTypes.DATE },
  // availableDate: { type: DataTypes.DATE },
  // marketCountry: { type: DataTypes.STRING },
  brandOwner: { type: DataTypes.STRING },
  brandName: { type: DataTypes.STRING },
  // gtinUpc: { type: DataTypes.STRING },
  // dataSource: { type: DataTypes.STRING },
  ingredients: { type: DataTypes.TEXT() },
  servingSize: { type: DataTypes.FLOAT },
  servingSizeUnit: { type: DataTypes.STRING },
  // householdServingFullText: { type: DataTypes.STRING },
  shortDescription: { type: DataTypes.STRING },
  brandedFoodCategory: { type: DataTypes.STRING },
  dataType: { type: DataTypes.STRING },
  // fdcId: { type: DataTypes.INTEGER },
  // publicationDate: { type: DataTypes.DATE },
  packageWeight: { type: DataTypes.STRING },
  // Add other properties as needed
});

module.exports = Food;
