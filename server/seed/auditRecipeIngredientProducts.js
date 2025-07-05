const Recipe = require('../db/models/Recipe/Recipe');
const { Food, Ingredient, SubstituteMapping, IngredientToCanonical, CanonicalIngredient } = require('../db/models');
const { Op, Sequelize } = require('sequelize');

// Copy of the cleaning function from foodRoutes.js
function cleanIngredientName(raw) {
  if (!raw) return '';
  let cleaned = raw.toLowerCase();
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/optional|such as.*?\(.*?\)/g, '');
  cleaned = cleaned.replace(/(^|\s)(\d+[\/\d]*\s*)/g, ' ');
  cleaned = cleaned.replace(/(?<=\s|^)(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|kilograms?|kg|liters?|l|milliliters?|ml|package|can|container|envelope|slice|loaf|pinch|dash|quart|qt|pint|pt|gallon|gal|stick|clove|head|bunch|sprig|piece|sheet|bag|bottle|jar|box|packet|drop|ear|stalk|strip|cube|block|bar)(?=\s|$)/g, '');
  cleaned = cleaned.replace(/\b(sliced|chopped|fresh|dried|mild|to taste|and)\b/g, '');
  cleaned = cleaned.replace(/\b(leaves?|slices?)\b/g, '');
  cleaned = cleaned.replace(/\b(yellow|white|black)\b/g, '');
  cleaned = cleaned.replace(/,\s*$/, '');
  cleaned = cleaned.replace(/^\s*,\s*/, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();
  return cleaned;
}

async function auditRecipeIngredientProducts() {
  // Always include the '1-Dish Pepperoni Cheese Pizza Bake' recipe
  const focusRecipe = await Recipe.findOne({ where: { title: '1-Dish Pepperoni Cheese Pizza Bake' }, include: [Ingredient] });
  // Get 49 random recipes (excluding the focus recipe if present)
  const randomRecipes = await Recipe.findAll({ 
    where: focusRecipe ? { id: { [Op.ne]: focusRecipe.id } } : {},
    limit: 49, 
    order: Sequelize.literal('RANDOM()'), 
    include: [Ingredient] 
  });
  // Combine, with focus recipe first
  const recipes = focusRecipe ? [focusRecipe, ...randomRecipes] : randomRecipes;

  for (const recipe of recipes) {
    console.log(`\n=== Recipe: ${recipe.title} ===`);
    for (const ingredientObj of recipe.Ingredients) {
      const ingredientRaw = ingredientObj.name;
      const ingredientName = cleanIngredientName(ingredientRaw);
      if (!ingredientName || ingredientName.endsWith(':')) continue;

      // Try to map to canonical ingredient
      let canonical = null;
      let aliases = [];
      const mapping = await IngredientToCanonical.findOne({ where: { messyName: ingredientName.toLowerCase() } });
      if (mapping) {
        const canonicalObj = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
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
      const products = await Food.findAll({
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
        const subProducts = await Food.findAll({
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