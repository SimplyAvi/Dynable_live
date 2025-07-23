const db = require('./db/database.js');

async function testRecipeBenchmarks() {
  try {
    await db.authenticate();
    const Recipe = require('./db/models/Recipe/Recipe.js');
    const RecipeIngredient = require('./db/models/Recipe/RecipeIngredient.js');
    const IngredientCategorized = require('./db/models/IngredientCategorized.js');
    
    console.log('🧪 TESTING RECIPE BENCHMARKS...\n');
    
    // Test known working recipes
    const testRecipes = [
      { id: 17, name: 'Whaler Fish Sandwich' },
      { id: 1, name: 'Aaron\'s Missouri Burger' },
      { id: 2, name: 'Pizza Recipe' },
      { id: 3, name: 'Chicken Salad' },
      { id: 4, name: 'Beef Tacos' }
    ];
    
    for (const testRecipe of testRecipes) {
      console.log(`\n📋 TESTING RECIPE: ${testRecipe.name} (ID: ${testRecipe.id})`);
      console.log('=' .repeat(60));
      
      try {
        const recipe = await Recipe.findByPk(testRecipe.id, {
          include: [{
            model: RecipeIngredient,
            as: 'RecipeIngredients'
          }]
        });
        
        if (!recipe) {
          console.log(`  ❌ Recipe not found`);
          continue;
        }
        
        console.log(`  ✅ Recipe found: "${recipe.name}"`);
        console.log(`  📝 Description: ${recipe.description || 'No description'}`);
        console.log(`  🍽️  Servings: ${recipe.servings || 'Not specified'}`);
        console.log(`  ⏱️  Prep time: ${recipe.prepTime || 'Not specified'}`);
        console.log(`  🔥 Cook time: ${recipe.cookTime || 'Not specified'}`);
        
        if (!recipe.RecipeIngredients || recipe.RecipeIngredients.length === 0) {
          console.log(`  ❌ No ingredients found`);
          continue;
        }
        
        console.log(`\n  📋 INGREDIENTS (${recipe.RecipeIngredients.length}):`);
        
        let totalRecipeIngredients = 0;
        let mappedRecipeIngredients = 0;
        let ingredientsWithRealProducts = 0;
        let ingredientsWithPureProducts = 0;
        
        for (const ingredient of recipe.RecipeIngredients) {
          totalRecipeIngredients++;
          console.log(`\n    ${totalRecipeIngredients}. "${ingredient.name}"`);
          console.log(`       Amount: ${ingredient.amount || 'Not specified'}`);
          console.log(`       Unit: ${ingredient.unit || 'Not specified'}`);
          
          // Check if ingredient has canonical mapping
          const canonicalMapping = await db.query(`
            SELECT ci.name as "canonicalName" 
            FROM "IngredientToCanonicals" itc
            JOIN "CanonicalRecipeIngredients" ci ON itc."IngredientId" = ci.id
            WHERE itc."messyName" = :ingredientName
            LIMIT 1
          `, {
            replacements: { ingredientName: ingredient.name.toLowerCase() },
            type: db.QueryTypes.SELECT
          });
          
          if (canonicalMapping.length > 0) {
            mappedRecipeIngredients++;
            const canonicalName = canonicalMapping[0].canonicalName;
            console.log(`       ✅ Mapped to: "${canonicalName}"`);
            
            // Check products for this canonical
            const products = await IngredientCategorized.findAll({
              where: {
                canonicalTag: canonicalName
              },
              order: [
                [db.Sequelize.literal('CASE WHEN "brandOwner" != \'Generic\' THEN 0 ELSE 1 END'), 'ASC'],
                ['description', 'ASC']
              ],
              limit: 5
            });
            
            if (products.length > 0) {
              ingredientsWithRealProducts++;
              console.log(`       🛒 Products found: ${products.length}`);
              
              let hasRealProducts = false;
              let hasPureProducts = false;
              
              for (const product of products) {
                const isReal = product.brandOwner !== 'Generic';
                const isPure = isReal && isPureIngredient(product, canonicalName);
                
                if (isReal) hasRealProducts = true;
                if (isPure) hasPureProducts = true;
                
                console.log(`         • "${product.description}" (${product.brandOwner})`);
                console.log(`           ${isReal ? '✅ Real' : '❌ Generic'} | ${isPure ? '✅ Pure' : '❌ Processed'}`);
              }
              
              if (hasRealProducts) {
                ingredientsWithRealProducts++;
              }
              if (hasPureProducts) {
                ingredientsWithPureProducts++;
              }
            } else {
              console.log(`       ❌ No products found`);
            }
          } else {
            console.log(`       ❌ No canonical mapping`);
          }
        }
        
        // Recipe summary
        const mappingRate = ((mappedRecipeIngredients / totalRecipeIngredients) * 100).toFixed(1);
        const realProductRate = ((ingredientsWithRealProducts / totalRecipeIngredients) * 100).toFixed(1);
        const pureProductRate = ((ingredientsWithPureProducts / totalRecipeIngredients) * 100).toFixed(1);
        
        console.log(`\n  📊 RECIPE SUMMARY:`);
        console.log(`     Total ingredients: ${totalRecipeIngredients}`);
        console.log(`     Mapped ingredients: ${mappedRecipeIngredients} (${mappingRate}%)`);
        console.log(`     With real products: ${ingredientsWithRealProducts} (${realProductRate}%)`);
        console.log(`     With pure products: ${ingredientsWithPureProducts} (${pureProductRate}%)`);
        
        // Recipe quality score
        let qualityScore = 0;
        if (mappingRate >= 80) qualityScore += 25;
        if (mappingRate >= 60) qualityScore += 15;
        if (realProductRate >= 80) qualityScore += 25;
        if (realProductRate >= 60) qualityScore += 15;
        if (pureProductRate >= 60) qualityScore += 25;
        if (pureProductRate >= 40) qualityScore += 15;
        if (totalRecipeIngredients > 0) qualityScore += 25;
        
        const finalScore = ((qualityScore / 100) * 100).toFixed(1);
        
        console.log(`     Quality Score: ${finalScore}%`);
        
        if (finalScore >= 80) {
          console.log(`     🟢 EXCELLENT - Ready for allergen testing`);
        } else if (finalScore >= 60) {
          console.log(`     🟡 GOOD - Needs some improvements`);
        } else {
          console.log(`     🔴 NEEDS WORK - Significant improvements needed`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing recipe: ${error.message}`);
      }
    }
    
    console.log('\n🎉 BENCHMARK TESTING COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

function isPureIngredient(product, canonicalName) {
  const description = product.description?.toLowerCase() || '';
  const ingredients = product.ingredients?.toLowerCase() || '';
  
  // Pure ingredients should have minimal processing
  const pureKeywords = [
    'pure', 'natural', 'organic', 'unrefined', 'raw', 'whole',
    'fresh', 'minimal', 'simple', 'basic', 'essential'
  ];
  
  // Check if product description suggests purity
  for (const keyword of pureKeywords) {
    if (description.includes(keyword)) {
      return true;
    }
  }
  
  // Check if ingredients list is simple (just the ingredient itself)
  if (ingredients && ingredients.length > 0) {
    const ingredientList = ingredients.split(',').map(i => i.trim().toLowerCase());
    if (ingredientList.length === 1 && ingredientList[0].includes(canonicalName.toLowerCase())) {
      return true;
    }
  }
  
  // Common pure ingredients that are typically unprocessed
  const pureRecipeIngredients = [
    'salt', 'sugar', 'honey', 'maple syrup', 'olive oil', 'coconut oil',
    'almond milk', 'soy milk', 'oat milk', 'rice', 'quinoa', 'lentils',
    'chickpeas', 'black beans', 'kidney beans', 'pinto beans',
    'almonds', 'walnuts', 'cashews', 'peanuts', 'sunflower seeds',
    'chia seeds', 'flax seeds', 'pumpkin seeds'
  ];
  
  for (const pureIngredient of pureRecipeIngredients) {
    if (canonicalName.toLowerCase().includes(pureIngredient)) {
      return true;
    }
  }
  
  return false;
}

testRecipeBenchmarks(); 