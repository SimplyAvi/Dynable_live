const sequelize = require('../database');
const Food = require('./Food');
const FoodNutrient = require('./FoodNutrient');
const Nutrient = require('./Nutrient');
const FoodNutrientDerivation = require('./FoodNutrientDerivation');
const FoodNutrientSource = require('./FoodNutrientSource');
const FoodAttribute = require('./FoodAttribute');
const FoodAttributeType = require('./FoodAttributeType');
const Recipe = require('./Recipe/Recipe')
const Ingredient =  require('./Recipe/Ingredient')
const Category = require('./Categories/Category')
const Subcategory = require('./Categories/Subcategory')
const User = require('./User');
const Cart = require('./Cart');
const Order = require('./Order');
const AllergenDerivative = require('./AllergenDerivative');
const CanonicalIngredient = require('./CanonicalIngredient');
const IngredientToCanonical = require('./IngredientToCanonical');
const Substitution = require('./Substitution');
const IngredientMatchingRule = require('./IngredientMatchingRule');
const SubstituteMapping = require('./SubstituteMapping');

// Define associations
Food.hasMany(FoodNutrient);
Food.hasMany(FoodAttribute);
Category.hasMany(Subcategory, { foreignKey: 'CategoryID', as: 'subcategories' });
Subcategory.belongsTo(Category, { foreignKey: 'CategoryID' });
Subcategory.hasMany(Ingredient, { foreignKey: 'SubcategoryID' });
Ingredient.belongsTo(Subcategory, { foreignKey: 'SubcategoryID' });
Subcategory.hasMany(Food, { foreignKey: 'SubcategoryID' });  
Food.belongsTo(Subcategory, {foreignKey: 'SubcategoryID'})

// Associations
CanonicalIngredient.hasMany(IngredientToCanonical, { foreignKey: 'CanonicalIngredientId' });
IngredientToCanonical.belongsTo(CanonicalIngredient, { foreignKey: 'CanonicalIngredientId' });

CanonicalIngredient.hasMany(Substitution, { foreignKey: 'CanonicalIngredientId' });
Substitution.belongsTo(CanonicalIngredient, { foreignKey: 'CanonicalIngredientId' });

// Define other associations here

module.exports = {
  sequelize,
  Food,
  FoodNutrient,
  Nutrient,
  FoodNutrientDerivation,
  FoodNutrientSource,
  FoodAttribute,
  FoodAttributeType,
  Recipe,
  Ingredient,
  Category,
  Subcategory,
  User,
  Cart,
  Order,
  AllergenDerivative,
  CanonicalIngredient,
  IngredientToCanonical,
  Substitution,
  IngredientMatchingRule,
  SubstituteMapping
};
