const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Food = sequelize.define('Food', {
  foodClass: { type: DataTypes.TEXT() },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  modifiedDate: { type: DataTypes.DATE },
  availableDate: { type: DataTypes.DATE },
  marketCountry: { type: DataTypes.STRING },
  brandOwner: { type: DataTypes.STRING },
  brandName: { type: DataTypes.STRING },
  gtinUpc: { type: DataTypes.STRING },
  dataSource: { type: DataTypes.STRING },
  ingredients: { type: DataTypes.TEXT() },
  servingSize: { type: DataTypes.FLOAT },
  servingSizeUnit: { type: DataTypes.STRING },
  householdServingFullText: { type: DataTypes.STRING },
  shortDescription: { type: DataTypes.STRING },
  brandedFoodCategory: { type: DataTypes.TEXT() },
  dataType: { type: DataTypes.STRING },
  fdcId: { type: DataTypes.INTEGER },
  publicationDate: { type: DataTypes.DATE },
  packageWeight: { type: DataTypes.STRING },
  allergens: {type:DataTypes.ARRAY(DataTypes.STRING)},
  SubcategoryID: { type: DataTypes.INTEGER },
  canonicalTag: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Main canonical ingredient/category for precise matching'
  },
  canonicalTagConfidence: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Confidence level for canonicalTag assignment: confident, suggested, none'
  },
  // Add other properties as needed
});

module.exports = Food;
