const { CanonicalIngredient, Substitution, Food } = require('./db/models');
const sequelize = require('./db/database');

async function testSubstituteProducts() {
  console.log('🧪 Testing Substitute Products Endpoint\n');

  try {
    await sequelize.sync({ force: false });

    // Test cases for the 9 major allergens
    const testCases = [
      'flour, wheat',           // Wheat allergen
      'milk, cow',              // Milk allergen  
      'egg, chicken',           // Egg allergen
      'almond',                 // Tree nuts allergen
      'peanut',                 // Peanut allergen
      'shrimp',                 // Shellfish allergen
      'salmon',                 // Fish allergen
      'soybean',                // Soy allergen
      'sesame'                  // Sesame allergen
    ];

    for (const canonicalIngredient of testCases) {
      console.log(`\n🔍 Testing: "${canonicalIngredient}"`);
      
      // Find the canonical ingredient
      const canonical = await CanonicalIngredient.findOne({
        where: { name: canonicalIngredient }
      });

      if (!canonical) {
        console.log(`   ❌ Canonical ingredient not found`);
        continue;
      }

      console.log(`   ✅ Found canonical ingredient`);
      console.log(`   📋 Allergens: ${canonical.allergens?.join(', ') || 'none'}`);

      // Get substitutions
      const substitutions = await Substitution.findAll({
        where: { CanonicalIngredientId: canonical.id }
      });

      console.log(`   🔄 Found ${substitutions.length} substitutions:`);
      
      for (const sub of substitutions) {
        console.log(`      - ${sub.substituteName} (${sub.notes})`);
        
        // Check if we have products for this substitute
        const products = await Food.findAll({
          where: {
            canonicalTag: sub.substituteName.toLowerCase(),
            canonicalTagConfidence: 'confident'
          },
          limit: 3
        });

        if (products.length > 0) {
          console.log(`        ✅ ${products.length} products found:`);
          products.forEach((product, index) => {
            console.log(`          ${index + 1}. ${product.description}`);
          });
        } else {
          console.log(`        ⚠️  No products found (may need canonical tagging)`);
        }
      }
    }

    // Test specific substitute examples
    console.log('\n🎯 Testing Specific Substitute Examples:');
    
    const specificTests = [
      { ingredient: 'flour, wheat', substitute: 'rice flour' },
      { ingredient: 'flour, wheat', substitute: 'gluten-free flour blend' },
      { ingredient: 'milk, cow', substitute: 'almond milk' },
      { ingredient: 'egg, chicken', substitute: 'flax egg' }
    ];

    for (const test of specificTests) {
      console.log(`\n🔍 Testing substitute: "${test.substitute}" for "${test.ingredient}"`);
      
      const products = await Food.findAll({
        where: {
          canonicalTag: test.substitute.toLowerCase(),
          canonicalTagConfidence: 'confident'
        },
        limit: 5
      });

      if (products.length > 0) {
        console.log(`   ✅ Found ${products.length} products:`);
        products.forEach((product, index) => {
          console.log(`      ${index + 1}. ${product.description}`);
        });
      } else {
        console.log(`   ⚠️  No products found - may need to run canonical tag suggestion for "${test.substitute}"`);
      }
    }

    console.log('\n🎉 Substitute products test complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run canonical tag suggestion for substitute ingredients');
    console.log('   2. Test the /api/recipe/substitute-products endpoint');
    console.log('   3. Integrate with frontend substitution UI');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testSubstituteProducts(); 