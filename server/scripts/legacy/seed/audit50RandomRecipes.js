const { Recipe, Ingredient } = require('../db/models');
const { Ingredient, IngredientToCanonical, Substitution, IngredientCategorized } = require('../db/models');
const Sequelize = require('../db/database');

const MAJOR_ALLERGENS = [
  'milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soy', 'sesame', 'gluten'
];

async function audit50RandomRecipes() {
  console.log('🔍 Auditing 50 Random Recipes for Allergen Substitute Coverage...\n');
  const recipes = await Recipe.findAll({ order: [ [Sequelize.literal('RANDOM()')] ], limit: 50, include: [ { model: Ingredient, as: 'RecipeIngredients' } ] });
  let totalRecipeIngredients = 0;
  let missingCanonical = 0;
  let missingSubstitute = 0;
  let missingPureProduct = 0;
  let fullyCovered = 0;

  for (const recipe of recipes) {
    console.log(`\n🍽️  Recipe: ${recipe.name}`);
    for (const ing of recipe.RecipeIngredients) {
      totalRecipeIngredients++;
      const messy = ing.name.toLowerCase();
      // 1. Canonical mapping
      const mapping = await IngredientToCanonical.findOne({ where: { messyName: messy } });
      if (!mapping) {
        console.log(`   ❌ No canonical mapping for: ${messy}`);
        missingCanonical++;
        continue;
      }
      const canonical = await Ingredient.findByPk(mapping.IngredientId);
      if (!canonical) {
        console.log(`   ❌ No canonical ingredient for mapping: ${messy}`);
        missingCanonical++;
        continue;
      }
      // 2. For each major allergen, check if this ingredient is flagged
      let covered = true;
      for (const allergen of MAJOR_ALLERGENS) {
        if (canonical.allergens && canonical.allergens.map(a => a.toLowerCase()).includes(allergen)) {
          // 3. Substitutes
          const subs = await Substitution.findAll({ where: { IngredientId: canonical.id } });
          if (!subs || subs.length === 0) {
            console.log(`   ❌ No substitutes for: ${canonical.name} (allergen: ${allergen})`);
            missingSubstitute++;
            covered = false;
            continue;
          }
          // 4. For each substitute, check for pure products
          let foundPure = false;
          for (const sub of subs) {
            const pure = await IngredientCategorized.findOne({ where: { canonicalTag: sub.substituteName.toLowerCase(), canonicalTagConfidence: 'confident' } });
            if (pure) foundPure = true;
          }
          if (!foundPure) {
            console.log(`   ❌ No pure product for any substitute of: ${canonical.name} (allergen: ${allergen})`);
            missingPureProduct++;
            covered = false;
          }
        }
      }
      if (covered) fullyCovered++;
    }
  }
  console.log(`\nSummary:`);
  console.log(`   Total ingredients checked: ${totalRecipeIngredients}`);
  console.log(`   Fully covered: ${fullyCovered}`);
  console.log(`   Missing canonical: ${missingCanonical}`);
  console.log(`   Missing substitute: ${missingSubstitute}`);
  console.log(`   Missing pure product: ${missingPureProduct}`);
  console.log('Audit complete!');
}

audit50RandomRecipes(); 