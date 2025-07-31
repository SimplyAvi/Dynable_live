const {
  sequelize,
  IngredientCategorized,
  Recipe,
  RecipeIngredient,
  Ingredient,
  IngredientToCanonical,
  Subcategory
} = require('../db/models');
const { cleanIngredientName } = require('../api/foodRoutes');
const { Op, Sequelize } = require('sequelize');
const fs = require('fs');

async function auditRecipeIngredientProducts() {
  // Always include the '1-Dish Pepperoni Cheese Pizza Bake' recipe
  const focusRecipe = await Recipe.findOne({ where: { title: '1-Dish Pepperoni Cheese Pizza Bake' }, include: [RecipeIngredient] });
  // Get 49 random recipes (excluding the focus recipe if present)
  const randomRecipes = await Recipe.findAll({ 
    where: focusRecipe ? { id: { [Op.ne]: focusRecipe.id } } : {},
    limit: 49, 
    order: Sequelize.literal('RANDOM()'), 
    include: [RecipeIngredient] 
  });
  // Combine, with focus recipe first
  const recipes = focusRecipe ? [focusRecipe, ...randomRecipes] : randomRecipes;

  for (const recipe of recipes) {
    console.log(`\n=== Recipe: ${recipe.title} ===`);
    for (const ingredientObj of recipe.RecipeRecipeIngredients) {
      const ingredientRaw = ingredientObj.name;
      const ingredientName = cleanIngredientName(ingredientRaw);
      if (!ingredientName || ingredientName.endsWith(':')) continue;

      // Try to map to canonical ingredient
      let canonical = null;
      let aliases = [];
      const mapping = await IngredientToCanonical.findOne({ where: { messyName: ingredientName.toLowerCase() } });
      if (mapping) {
        const canonicalObj = await Ingredient.findByPk(mapping.IngredientId);
        if (canonicalObj) {
          canonical = canonicalObj.name;
          aliases = canonicalObj.aliases || [];
        }
      }
      let canonicalTags = [];
      if (canonical) canonicalTags.push(canonical.toLowerCase());
      if (aliases && aliases.length > 0) canonicalTags = canonicalTags.concat(aliases.map(a => a.toLowerCase()));
      canonicalTags = [...new Set(canonicalTags.filter(Boolean))];
      if (canonicalTags.length === 0) canonicalTags = [ingredientName.toLowerCase()];

      // Query for all matching products (limit 10 for preview)
      const products = await IngredientCategorized.findAll({
        where: { canonicalTag: { [Op.in]: canonicalTags } },
        limit: 10,
        order: [['description', 'ASC']]
      });

      if (products.length === 0) {
        console.log(`❌ No products found for ingredient: "${ingredientRaw}" (cleaned: "${ingredientName}")`);
      } else {
        const suspicious = !products.some(p => p.description.toLowerCase().includes(ingredientName));
        if (suspicious) {
          console.log(`⚠️  Suspicious products for ingredient: "${ingredientRaw}" (cleaned: "${ingredientName}")`);
        } else {
          console.log(`✅ Products found for ingredient: "${ingredientRaw}" (cleaned: "${ingredientName}")`);
        }
        products.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.description}`);
        });
      }

      // Test substitute if available
      const substitute = await SubstituteMapping.findOne({ where: { substituteType: ingredientName } });
      if (substitute) {
        let subTags = [substitute.substituteType.toLowerCase()];
        if (substitute.searchTerms && substitute.searchTerms.length > 0) {
          subTags = subTags.concat(substitute.searchTerms.map(s => s.toLowerCase()));
        }
        subTags = [...new Set(subTags.filter(Boolean))];
        const subProducts = await IngredientCategorized.findAll({
          where: { canonicalTag: { [Op.in]: subTags } },
          limit: 10,
          order: [['description', 'ASC']]
        });
        if (subProducts.length === 0) {
          console.log(`   ❌ No products found for substitute: "${substitute.substituteType}"`);
        } else {
          console.log(`   ✅ Products found for substitute: "${substitute.substituteType}"`);
          subProducts.forEach((p, i) => {
            console.log(`     ${i + 1}. ${p.description}`);
          });
        }
      }
    }
  }
  process.exit(0);
}

auditRecipeIngredientProducts(); 