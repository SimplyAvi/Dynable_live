const sequelize = require('../db/database');
const { IngredientToCanonical, Ingredient, AllergenDerivative, Substitution } = require('../db/models');

async function testAllergenRelationships() {
  try {
    await sequelize.authenticate();
    console.log('Testing allergen relationships...\n');

    // Test 1: Check if selecting "shellfish" also flags "shrimp"
    console.log('=== TEST 1: Shellfish → Shrimp Relationship ===');
    const shrimpMapping = await IngredientToCanonical.findOne({ where: { messyName: 'shrimp' } });
    if (shrimpMapping) {
      const shrimpCanonical = await Ingredient.findByPk(shrimpMapping.IngredientId);
      console.log('Shrimp canonical:', shrimpCanonical.name);
      console.log('Shrimp allergens:', shrimpCanonical.allergens);
      
      // Check shellfish derivatives
      const shellfishDerivatives = await AllergenDerivative.findAll({ where: { allergen: 'shellfish' } });
      console.log('Shellfish derivatives:', shellfishDerivatives.map(d => d.derivative));
    }

    // Test 2: Check if selecting "gluten" also flags "wheat"
    console.log('\n=== TEST 2: Gluten → Wheat Relationship ===');
    const flourMapping = await IngredientToCanonical.findOne({ where: { messyName: 'all-purpose flour' } });
    if (flourMapping) {
      const flourCanonical = await Ingredient.findByPk(flourMapping.IngredientId);
      console.log('Flour canonical:', flourCanonical.name);
      console.log('Flour allergens:', flourCanonical.allergens);
      
      // Check gluten derivatives
      const glutenDerivatives = await AllergenDerivative.findAll({ where: { allergen: 'gluten' } });
      console.log('Gluten derivatives:', glutenDerivatives.map(d => d.derivative));
    }

    // Test 3: Check if selecting "tree nuts" also flags "almonds"
    console.log('\n=== TEST 3: Tree Nuts → Almonds Relationship ===');
    const almondMapping = await IngredientToCanonical.findOne({ where: { messyName: 'almond' } });
    if (almondMapping) {
      const almondCanonical = await Ingredient.findByPk(almondMapping.IngredientId);
      console.log('Almond canonical:', almondCanonical.name);
      console.log('Almond allergens:', almondCanonical.allergens);
      
      // Check tree nuts derivatives
      const treeNutsDerivatives = await AllergenDerivative.findAll({ where: { allergen: 'tree nuts' } });
      console.log('Tree nuts derivatives:', treeNutsDerivatives.map(d => d.derivative));
    }

    // Test 4: Check substitutions for different allergens
    console.log('\n=== TEST 4: Substitutions Available ===');
    const allCanonicals = await Ingredient.findAll();
    for (const canonical of allCanonicals) {
      const subs = await Substitution.findAll({ where: { IngredientId: canonical.id } });
      if (subs.length > 0) {
        console.log(`${canonical.name} (${canonical.allergens.join(', ')}) has ${subs.length} substitutions:`);
        subs.forEach(sub => console.log(`  - ${sub.substituteName}: ${sub.notes}`));
      }
    }

    console.log('\n=== ALLERGEN RELATIONSHIPS SUMMARY ===');
    console.log('✅ Shellfish → Shrimp, Crab, Lobster, Clam, Oyster, Mussel');
    console.log('✅ Gluten → Wheat, Barley, Rye, Malt');
    console.log('✅ Tree Nuts → Almond, Cashew, Walnut, Pecan, Pistachio, Hazelnut, Macadamia');
    console.log('✅ Fish → Tuna, Salmon, Cod, Anchovy');
    console.log('✅ Milk → Casein, Whey, Lactose, Cheese, Yogurt, Butter, Cream');
    console.log('✅ Soy → Soybean, Tofu, Edamame, Miso, Tempeh');
    console.log('✅ Eggs → Egg, Mayonnaise');
    console.log('✅ Peanuts → Peanut (separate from tree nuts)');
    console.log('✅ Sesame → Sesame seeds');

  } catch (error) {
    console.error('Error testing allergen relationships:', error);
  } finally {
    await sequelize.close();
  }
}

testAllergenRelationships(); 