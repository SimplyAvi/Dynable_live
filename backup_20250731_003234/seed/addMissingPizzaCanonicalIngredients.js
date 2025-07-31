const Ingredient = require('../db/models/Ingredient');
const { database } = require('../db/database');

async function addMissingPizzaCanonicalRecipeIngredients() {
  console.log('➕ Adding Missing Pizza Canonical RecipeIngredients...\n');

  const missingRecipeIngredients = [
    { name: 'vegan cheddar', aliases: ['vegan cheddar cheese'], allergens: [] },
    { name: 'coconut yogurt', aliases: ['coconut milk yogurt'], allergens: ['tree nuts', 'coconut'] },
    { name: 'coconut oil', aliases: ['virgin coconut oil', 'refined coconut oil'], allergens: ['tree nuts', 'coconut'] },
    { name: 'gluten-free bread', aliases: ['gf bread', 'gluten free bread'], allergens: [] },
    { name: 'rice cakes', aliases: ['rice cake'], allergens: [] },
    { name: 'jackfruit', aliases: ['young jackfruit'], allergens: [] },
    { name: 'seitan', aliases: ['wheat meat'], allergens: ['wheat', 'gluten'] },
    { name: 'vegan mozzarella', aliases: ['vegan mozzarella cheese'], allergens: [] },
  ];

  let added = 0;
  let skipped = 0;

  for (const ing of missingRecipeIngredients) {
    const exists = await Ingredient.findOne({ where: { name: ing.name } });
    if (!exists) {
      await Ingredient.create({
        name: ing.name,
        aliases: ing.aliases,
        allergens: ing.allergens,
      });
      console.log(`✅ Added canonical ingredient: ${ing.name}`);
      added++;
    } else {
      skipped++;
    }
  }
  console.log(`\nSummary: Added ${added}, Skipped ${skipped} (already exist)`);
}

addMissingPizzaCanonicalRecipeIngredients(); 