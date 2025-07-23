const db = require('./db/database');

async function testComprehensiveCoverage() {
  try {
    console.log('🧪 COMPREHENSIVE COVERAGE TEST');
    console.log('Testing early, mid, and late recipes...\n');

    // Test early recipes (1-1000)
    console.log('📖 EARLY RECIPES (1-1000)');
    const earlyRecipes = await testRecipeRange(1, 1000, 10);
    
    // Test mid recipes (20000-30000)
    console.log('\n📖 MID RECIPES (20000-30000)');
    const midRecipes = await testRecipeRange(20000, 30000, 10);
    
    // Test late recipes (70000-73322)
    console.log('\n📖 LATE RECIPES (70000-73322)');
    const lateRecipes = await testRecipeRange(70000, 73322, 10);

    // Summary
    console.log('\n📊 COMPREHENSIVE COVERAGE SUMMARY');
    console.log('=====================================');
    console.log(`Early Recipes: ${earlyRecipes.mappingCoverage}% mapping, ${earlyRecipes.realProductCoverage}% real products`);
    console.log(`Mid Recipes: ${midRecipes.mappingCoverage}% mapping, ${midRecipes.realProductCoverage}% real products`);
    console.log(`Late Recipes: ${lateRecipes.mappingCoverage}% mapping, ${lateRecipes.realProductCoverage}% real products`);
    
    const overallMapping = (earlyRecipes.mappingCoverage + midRecipes.mappingCoverage + lateRecipes.mappingCoverage) / 3;
    const overallReal = (earlyRecipes.realProductCoverage + midRecipes.realProductCoverage + lateRecipes.realProductCoverage) / 3;
    
    console.log(`\n🎯 OVERALL AVERAGE:`);
    console.log(`Mapping Coverage: ${overallMapping.toFixed(1)}%`);
    console.log(`Real Product Coverage: ${overallReal.toFixed(1)}%`);
    
    if (overallMapping > 70 && overallReal > 15) {
      console.log('\n✅ SUCCESS: Comprehensive coverage achieved!');
      console.log('The logic is working well across all recipe ranges.');
    } else {
      console.log('\n⚠️  NEEDS IMPROVEMENT: Coverage could be better.');
      console.log('Consider running additional mapping phases.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function testRecipeRange(startId, endId, sampleSize) {
  const recipes = await db.query(`
    SELECT id 
    FROM "Recipes" 
    WHERE id BETWEEN :startId AND :endId 
    ORDER BY RANDOM() 
    LIMIT :sampleSize
  `, { 
    replacements: { startId, endId, sampleSize },
    type: require('sequelize').QueryTypes.SELECT 
  });

  let totalRecipeIngredients = 0;
  let mappedRecipeIngredients = 0;
  let realProducts = 0;

  for (const recipe of recipes) {
    const ingredients = await db.query(`
      SELECT i.name, f."canonicalTag"
      FROM "RecipeIngredients" i
      LEFT JOIN "IngredientCategorized" f ON LOWER(REPLACE(i.name, ' ', '')) = LOWER(REPLACE(f."canonicalTag", ' ', ''))
      WHERE i."RecipeId" = :recipeId
    `, { 
      replacements: { recipeId: recipe.id },
      type: require('sequelize').QueryTypes.SELECT 
    });

    totalRecipeIngredients += ingredients.length;
    
    for (const ingredient of ingredients) {
      if (ingredient.canonicalTag) {
        mappedRecipeIngredients++;
        
        // Check if there are real products for this canonical
        const realProductCount = await db.query(`
          SELECT COUNT(*) as count
          FROM "IngredientCategorized" 
          WHERE "canonicalTag" = :canonicalTag 
          AND "canonicalTagConfidence" = 'confident'
        `, { 
          replacements: { canonicalTag: ingredient.canonicalTag },
          type: require('sequelize').QueryTypes.SELECT 
        });
        
        if (realProductCount[0].count > 0) {
          realProducts++;
        }
      }
    }

    console.log(`  Recipe ${recipe.id}: ${ingredients.length} ingredients, ${ingredients.filter(i => i.canonicalTag).length} mapped`);
  }

  const mappingCoverage = totalRecipeIngredients > 0 ? (mappedRecipeIngredients / totalRecipeIngredients) * 100 : 0;
  const realProductCoverage = totalRecipeIngredients > 0 ? (realProducts / totalRecipeIngredients) * 100 : 0;

  return { mappingCoverage, realProductCoverage };
}

testComprehensiveCoverage(); 