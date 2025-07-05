const db = require('./db/database.js');

async function testFrontendRecipeCoverage() {
  try {
    await db.authenticate();
    const Recipe = require('./db/models/Recipe/Recipe.js');
    const Ingredient = require('./db/models/Recipe/Ingredient.js');
    const CanonicalIngredient = require('./db/models/CanonicalIngredient.js');
    const IngredientToCanonical = require('./db/models/IngredientToCanonical.js');
    const Food = require('./db/models/Food.js');
    
    console.log('🧪 Testing Frontend Recipe Coverage...\n');
    
    // Get a large sample of recipes
    const recipes = await Recipe.findAll({
      include: [{
        model: Ingredient,
        as: 'Ingredients'
      }],
      limit: 1000 // Test 1000 recipes
    });
    
    console.log(`📋 Testing ${recipes.length} recipes...\n`);
    
    let totalIngredients = 0;
    let mappedIngredients = 0;
    let ingredientsWithProducts = 0;
    let fullyFunctionalRecipes = 0;
    let partiallyFunctionalRecipes = 0;
    let nonFunctionalRecipes = 0;
    
    const recipeResults = [];
    
    // Test each recipe
    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      const recipeIngredients = recipe.Ingredients || [];
      
      let recipeMappedCount = 0;
      let recipeProductCount = 0;
      
      for (const ingredient of recipeIngredients) {
        totalIngredients++;
        
        // Clean ingredient name (same as frontend)
        const cleanedName = cleanIngredientName(ingredient.name);
        
        // Check if mapping exists
        const mapping = await IngredientToCanonical.findOne({
          where: { messyName: cleanedName }
        });
        
        if (mapping) {
          mappedIngredients++;
          recipeMappedCount++;
          
          // Check if canonical has products
          const canonical = await CanonicalIngredient.findByPk(mapping.CanonicalIngredientId);
          if (canonical) {
            const productCount = await Food.count({
              where: { canonicalTag: canonical.name }
            });
            
            if (productCount > 0) {
              ingredientsWithProducts++;
              recipeProductCount++;
            }
          }
        }
      }
      
      // Categorize recipe functionality
      const ingredientCount = recipeIngredients.length;
      const mappingPercentage = ingredientCount > 0 ? (recipeMappedCount / ingredientCount) * 100 : 0;
      const productPercentage = ingredientCount > 0 ? (recipeProductCount / ingredientCount) * 100 : 0;
      
      let functionality = 'non-functional';
      if (mappingPercentage >= 80 && productPercentage >= 80) {
        functionality = 'fully-functional';
        fullyFunctionalRecipes++;
      } else if (mappingPercentage >= 50 || productPercentage >= 50) {
        functionality = 'partially-functional';
        partiallyFunctionalRecipes++;
      } else {
        nonFunctionalRecipes++;
      }
      
      recipeResults.push({
        id: recipe.id,
        name: recipe.name,
        ingredientCount,
        mappedCount: recipeMappedCount,
        productCount: recipeProductCount,
        mappingPercentage: mappingPercentage.toFixed(1),
        productPercentage: productPercentage.toFixed(1),
        functionality
      });
      
      // Progress update every 100 recipes
      if ((i + 1) % 100 === 0) {
        console.log(`  ✅ Processed ${i + 1}/${recipes.length} recipes...`);
      }
    }
    
    // Calculate overall statistics
    const mappingCoverage = ((mappedIngredients / totalIngredients) * 100).toFixed(1);
    const productCoverage = ((ingredientsWithProducts / totalIngredients) * 100).toFixed(1);
    const fullyFunctionalPercentage = ((fullyFunctionalRecipes / recipes.length) * 100).toFixed(1);
    const partiallyFunctionalPercentage = ((partiallyFunctionalRecipes / recipes.length) * 100).toFixed(1);
    const nonFunctionalPercentage = ((nonFunctionalRecipes / recipes.length) * 100).toFixed(1);
    
    console.log('\n📊 FRONTEND READINESS REPORT');
    console.log('=' .repeat(50));
    console.log(`📋 Total Recipes Tested: ${recipes.length}`);
    console.log(`🥘 Total Ingredients: ${totalIngredients}`);
    console.log(`🔗 Ingredients with Mappings: ${mappedIngredients} (${mappingCoverage}%)`);
    console.log(`🛍️  Ingredients with Products: ${ingredientsWithProducts} (${productCoverage}%)`);
    
    console.log('\n🎯 Recipe Functionality Breakdown:');
    console.log(`  ✅ Fully Functional (80%+ coverage): ${fullyFunctionalRecipes} recipes (${fullyFunctionalPercentage}%)`);
    console.log(`  ⚠️  Partially Functional (50%+ coverage): ${partiallyFunctionalRecipes} recipes (${partiallyFunctionalPercentage}%)`);
    console.log(`  ❌ Non-Functional (<50% coverage): ${nonFunctionalRecipes} recipes (${nonFunctionalPercentage}%)`);
    
    // Show sample recipes by functionality
    console.log('\n📋 Sample Fully Functional Recipes:');
    const fullyFunctional = recipeResults.filter(r => r.functionality === 'fully-functional').slice(0, 5);
    fullyFunctional.forEach(recipe => {
      console.log(`  ✅ "${recipe.name}" (ID: ${recipe.id})`);
      console.log(`     ${recipe.mappedCount}/${recipe.ingredientCount} mapped, ${recipe.productCount}/${recipe.ingredientCount} with products`);
    });
    
    console.log('\n⚠️  Sample Partially Functional Recipes:');
    const partiallyFunctional = recipeResults.filter(r => r.functionality === 'partially-functional').slice(0, 5);
    partiallyFunctional.forEach(recipe => {
      console.log(`  ⚠️  "${recipe.name}" (ID: ${recipe.id})`);
      console.log(`     ${recipe.mappedCount}/${recipe.ingredientCount} mapped, ${recipe.productCount}/${recipe.ingredientCount} with products`);
    });
    
    console.log('\n❌ Sample Non-Functional Recipes:');
    const nonFunctional = recipeResults.filter(r => r.functionality === 'non-functional').slice(0, 5);
    nonFunctional.forEach(recipe => {
      console.log(`  ❌ "${recipe.name}" (ID: ${recipe.id})`);
      console.log(`     ${recipe.mappedCount}/${recipe.ingredientCount} mapped, ${recipe.productCount}/${recipe.ingredientCount} with products`);
    });
    
    // Frontend readiness assessment
    console.log('\n🎯 FRONTEND READINESS ASSESSMENT:');
    if (parseFloat(fullyFunctionalPercentage) >= 70) {
      console.log('  🟢 EXCELLENT: Frontend is ready for production!');
      console.log('     - Most recipes will work perfectly');
      console.log('     - Allergen filtering will be highly effective');
      console.log('     - Substitution suggestions will be comprehensive');
    } else if (parseFloat(fullyFunctionalPercentage) >= 50) {
      console.log('  🟡 GOOD: Frontend is ready for testing!');
      console.log('     - Many recipes will work well');
      console.log('     - Allergen filtering will work for most cases');
      console.log('     - Some recipes may need manual review');
    } else if (parseFloat(fullyFunctionalPercentage) >= 30) {
      console.log('  🟠 FAIR: Frontend needs some work');
      console.log('     - Some recipes will work');
      console.log('     - Allergen filtering will be limited');
      console.log('     - Consider adding more mappings');
    } else {
      console.log('  🔴 POOR: Frontend needs significant work');
      console.log('     - Most recipes won\'t work properly');
      console.log('     - Allergen filtering will be ineffective');
      console.log('     - Need to add many more mappings');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (parseFloat(fullyFunctionalPercentage) >= 70) {
      console.log('  ✅ Proceed with frontend integration');
      console.log('  ✅ Test with real users');
      console.log('  ✅ Monitor and improve gradually');
    } else {
      console.log('  🔧 Add more ingredient mappings');
      console.log('  🔧 Add more products for existing canonicals');
      console.log('  🔧 Consider batch processing remaining ingredients');
    }
    
  } catch (error) {
    console.error('❌ Error during frontend testing:', error);
  } finally {
    process.exit(0);
  }
}

function cleanIngredientName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, '') // Remove non-alphabetic characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

testFrontendRecipeCoverage(); 