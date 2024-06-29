const sequelize = require('../database');
const Food = require('./Food');
const FoodNutrient = require('./FoodNutrient');
const Nutrient = require('./Nutrient');
const FoodNutrientDerivation = require('./FoodNutrientDerivation');
const FoodNutrientSource = require('./FoodNutrientSource');
const FoodAttribute = require('./FoodAttribute');
const FoodAttributeType = require('./FoodAttributeType');
const Recipe = require('./Recipe/Recipe')
const Ingredient =  require('./Recipe/Ingredients')
const Category = require('./Categories/Category')
const Subcategory = require('./Categories/Subcategory')

Food.hasMany(FoodNutrient);
Food.hasMany(FoodAttribute);
// Define associations
Category.hasMany(Subcategory, { foreignKey: 'CategoryID' });
Subcategory.belongsTo(Category, { foreignKey: 'CategoryID' });
Subcategory.hasMany(Ingredient, { foreignKey: 'SubcategoryID' });
Ingredient.belongsTo(Subcategory, { foreignKey: 'SubcategoryID' });

// Sync models with the database
sequelize.sync();

// Define other associations here

module.exports = {
  Food,
  FoodNutrient,
  Nutrient,
  FoodNutrientDerivation,
  FoodNutrientSource,
  FoodAttribute,
  FoodAttributeType,
  Recipe
};
