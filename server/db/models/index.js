const sequelize = require('../database');
const IngredientCategorized = require('./IngredientCategorized');
const FoodNutrient = require('./FoodNutrient');
const Nutrient = require('./Nutrient');
const FoodNutrientDerivation = require('./FoodNutrientDerivation');
const FoodNutrientSource = require('./FoodNutrientSource');
const FoodAttribute = require('./FoodAttribute');
const FoodAttributeType = require('./FoodAttributeType');
const Recipe = require('./Recipe/Recipe');
const RecipeIngredient = require('./Recipe/RecipeIngredient');
const Category = require('./Categories/Category');
const Subcategory = require('./Categories/Subcategory');
const User = require('./User');
const Cart = require('./Cart');
const Order = require('./Order');
const AllergenDerivative = require('./AllergenDerivative');
const Ingredient = require('./Ingredient');
const IngredientToCanonical = require('./IngredientToCanonical');
const Substitution = require('./Substitution');
const IngredientMatchingRule = require('./IngredientMatchingRule');
const SubstituteMapping = require('./SubstituteMapping');

// Define associations
IngredientCategorized.hasMany(FoodNutrient);
FoodNutrient.belongsTo(IngredientCategorized);

Nutrient.hasMany(FoodNutrient);
FoodNutrient.belongsTo(Nutrient);

FoodNutrientDerivation.hasMany(FoodNutrient);
FoodNutrient.belongsTo(FoodNutrientDerivation);

FoodNutrientSource.hasMany(FoodNutrient);
FoodNutrient.belongsTo(FoodNutrientSource);

IngredientCategorized.hasMany(FoodAttribute);
FoodAttribute.belongsTo(IngredientCategorized);

FoodAttributeType.hasMany(FoodAttribute);
FoodAttribute.belongsTo(FoodAttributeType);

Ingredient.hasMany(IngredientToCanonical, { foreignKey: 'CanonicalIngredientId' });
IngredientToCanonical.belongsTo(Ingredient, { foreignKey: 'CanonicalIngredientId' });

Ingredient.hasMany(Substitution, { foreignKey: 'IngredientId' });
Substitution.belongsTo(Ingredient, { foreignKey: 'IngredientId' });

Recipe.hasMany(RecipeIngredient, { foreignKey: 'RecipeId' });
RecipeIngredient.belongsTo(Recipe, { foreignKey: 'RecipeId' });

Category.hasMany(Subcategory, { foreignKey: 'CategoryID' });
Subcategory.belongsTo(Category, { foreignKey: 'CategoryID' });

Subcategory.hasMany(IngredientCategorized, { foreignKey: 'SubcategoryID' });
IngredientCategorized.belongsTo(Subcategory, { foreignKey: 'SubcategoryID' });

User.hasMany(Cart);
Cart.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

// Define other associations here

module.exports = {
  sequelize,
  IngredientCategorized,
  FoodNutrient,
  Nutrient,
  FoodNutrientDerivation,
  FoodNutrientSource,
  FoodAttribute,
  FoodAttributeType,
  Recipe,
  RecipeIngredient,
  Category,
  Subcategory,
  User,
  Cart,
  Order,
  AllergenDerivative,
  Ingredient,
  IngredientToCanonical,
  Substitution,
  IngredientMatchingRule,
  SubstituteMapping
};
