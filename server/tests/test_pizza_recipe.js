const Recipe = require('./db/models/Recipe/Recipe');
const { IngredientCategorized, Ingredient, IngredientToCanonical, Ingredient } = require('./db/models');
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

async function testPizzaRecipe() {
  console.log('🍕 Testing Pizza Recipe Ingredient Matching\n');

  try {
    // Find the pizza recipe
    const pizzaRecipe = await Recipe.findOne({ 
      where: { title: '1-Dish Pepperoni Cheese Pizza Bake' }, 
      include: [Ingredient] 
    });

    if (!pizzaRecipe) {
      console.log('❌ Pizza recipe not found');
      return;
    }

    console.log(`✅ Found recipe: "${pizzaRecipe.title}"`);
    console.log(`📝 RecipeIngredients: ${pizzaRecipe.RecipeIngredients.length}\n`);

    for (const ingredientObj of pizzaRecipe.RecipeIngredients) {
      const ingredientRaw = ingredientObj.name;
      const ingredientName = cleanIngredientName(ingredientRaw);
      
      console.log(`🔍 Testing: "${ingredientRaw}"`);
      console.log(`   Cleaned: "${ingredientName}"`);

      if (!ingredientName || ingredientName.endsWith(':')) {
        console.log(`   ⚠️  Skipping (empty or section header)`);
        continue;
      }

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

      console.log(`   Canonical: "${canonical || 'none'}"`);
      console.log(`   Tags to search: [${canonicalTags.join(', ')}]`);

      // Query for matching products
      const products = await IngredientCategorized.findAll({
        where: { 
          canonicalTag: { [Op.in]: canonicalTags },
          canonicalTagConfidence: 'confident'
        },
        limit: 5,
        order: [['description', 'ASC']]
      });

      if (products.length > 0) {
        console.log(`   ✅ Found ${products.length} products:`);
        products.forEach((product, index) => {
          console.log(`      ${index + 1}. ${product.description}`);
        });
      } else {
        console.log(`   ❌ No products found`);
      }

      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPizzaRecipe(); 