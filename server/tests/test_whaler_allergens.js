const { Recipe, Ingredient, IngredientToCanonical, Ingredient, Substitution } = require('./db/models');
const { cleanIngredientName } = require('./api/foodRoutes');

async function testWhalerAllergens() {
  try {
    const ingredients = await Ingredient.findAll({ where: { RecipeId: 17 } });
    console.log('Testing allergen detection for Whaler Fish Sandwich ingredients:\n');
    
    for (const ing of ingredients) {
      const cleanedName = cleanIngredientName(ing.name);
      const mapping = await IngredientToCanonical.findOne({ where: { messyName: cleanedName.toLowerCase() } });
      let canonical = null;
      if (mapping) {
        canonical = await Ingredient.findByPk(mapping.IngredientId);
      }
      const subs = canonical ? await Substitution.findAll({ where: { IngredientId: canonical.id } }) : [];
      
      console.log(`Ingredient: '${ing.name}'`);
      console.log(`  Cleaned: '${cleanedName}'`);
      console.log(`  Canonical: '${canonical ? canonical.name : 'NOT FOUND'}'`);
      console.log(`  Allergens: ${canonical && canonical.allergens ? canonical.allergens.join(', ') : 'N/A'}`);
      console.log(`  Substitutes: ${subs.length}`);
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testWhalerAllergens(); 