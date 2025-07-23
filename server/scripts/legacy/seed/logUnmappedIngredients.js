const { Ingredient } = require('../db/models');
const IngredientToCanonical = require('../db/models/IngredientToCanonical');
const Ingredient = require('../db/models/Ingredient');
const { Op } = require('sequelize');
const { cleanIngredientName } = require('../api/foodRoutes');

async function logUnmappedRecipeIngredients() {
  // Get all unique ingredient names from recipes
  const allRecipeIngredients = await Ingredient.findAll({ attributes: ['name'], raw: true });
  const uniqueRecipeIngredients = Array.from(new Set(allRecipeIngredients.map(i => i.name).filter(Boolean)));

  const unmapped = [];
  for (const raw of uniqueRecipeIngredients) {
    const cleaned = cleanIngredientName(raw);
    if (!cleaned || cleaned.endsWith(':')) continue;
    const mapping = await IngredientToCanonical.findOne({ where: { messyName: cleaned.toLowerCase() } });
    if (!mapping) {
      unmapped.push({ raw, cleaned });
    }
  }

  if (unmapped.length === 0) {
    console.log('All ingredients are mapped!');
  } else {
    console.log(`Unmapped ingredients (${unmapped.length}):`);
    unmapped.forEach(({ raw, cleaned }) => {
      console.log(`  Raw: "${raw}"  |  Cleaned: "${cleaned}"`);
    });
  }
  process.exit(0);
}

logUnmappedRecipeIngredients(); 