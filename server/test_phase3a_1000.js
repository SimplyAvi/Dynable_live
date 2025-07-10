const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { Food, CanonicalIngredient, Recipe, Ingredient } = require('./db/models');
const cleanIngredientName = require('./scripts/data-processing/cleanIngredientName');
const fs = require('fs');

// Configuration for Phase 3A Test - 1,000 recipes
const TOTAL_RECIPES = 1000;
const BATCH_SIZE = 100; // Process 100 recipes per batch
const RESULTS_FILE = 'phase3a_1000_results.json';

// Caching for performance
const mappingCache = new Map();
const productCache = new Map();

async function testPhase3a1000() {
  console.log('🧪 TESTING PHASE 3A LOGIC (1,000 recipes)\n');
  console.log(`📊 Target: ${TOTAL_RECIPES} recipes`);
  console.log(`⚡ Optimizations: Caching, batch processing`);
  console.log(`⏱️  Estimated time: a few minutes\n`);
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    let totalIngredients = 0;
    let mappedIngredients = 0;
    let ingredientsWithRealProducts = 0;
    let unmappedFrequency = {};
    
    const startTime = Date.now();
    
    // Process recipes in batches
    for (let offset = 0; offset < TOTAL_RECIPES; offset += BATCH_SIZE) {
      const batchStart = Date.now();
      const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_RECIPES - offset);
      
      console.log(`\n🔄 Processing batch: recipes ${offset + 1}-${offset + currentBatchSize} (${Math.round((offset/TOTAL_RECIPES)*100)}% complete)`);
      
      // Get batch of recipes
      const recipes = await db.query(`
        SELECT 
          r.id,
          r.title,
          COUNT(i.id) as ingredient_count
        FROM "Recipes" r
        LEFT JOIN "Ingredients" i ON r.id = i."RecipeId"
        GROUP BY r.id, r.title
        ORDER BY r.id
        LIMIT :limit OFFSET :offset
      `, { 
        replacements: { limit: currentBatchSize, offset },
        type: Sequelize.QueryTypes.SELECT 
      });
      
      // Process recipes sequentially (for testing)
      for (const recipe of recipes) {
        const result = await processRecipe(recipe);
        totalIngredients += result.totalIngredients;
        mappedIngredients += result.mappedIngredients;
        ingredientsWithRealProducts += result.ingredientsWithRealProducts;
        
        // Merge unmapped frequency
        for (const [ingredient, count] of Object.entries(result.unmappedFrequency)) {
          unmappedFrequency[ingredient] = (unmappedFrequency[ingredient] || 0) + count;
        }
      }
      
      const batchTime = Date.now() - batchStart;
      const avgTimePerRecipe = batchTime / currentBatchSize;
      const remainingRecipes = TOTAL_RECIPES - (offset + currentBatchSize);
      const estimatedTimeRemaining = (remainingRecipes * avgTimePerRecipe) / 1000 / 60; // minutes
      
      console.log(`   ⏱️  Batch completed in ${(batchTime/1000).toFixed(1)}s (${avgTimePerRecipe.toFixed(0)}ms per recipe)`);
      console.log(`   📈 Current coverage: ${mappedIngredients}/${totalIngredients} (${(mappedIngredients/totalIngredients*100).toFixed(1)}%)`);
      console.log(`   🏪 Real products: ${ingredientsWithRealProducts}/${totalIngredients} (${(ingredientsWithRealProducts/totalIngredients*100).toFixed(1)}%)`);
      console.log(`   ⏳ Estimated time remaining: ${estimatedTimeRemaining.toFixed(1)} minutes`);
    }
    
    // Final analysis
    console.log('\n🎯 PHASE 3A TEST RESULTS (1,000 recipes)');
    console.log(`   📊 Total Ingredients: ${totalIngredients.toLocaleString()}`);
    console.log(`   🎯 Mapped Ingredients: ${mappedIngredients.toLocaleString()} (${(mappedIngredients/totalIngredients*100).toFixed(1)}%)`);
    console.log(`   🏪 Ingredients with Real Products: ${ingredientsWithRealProducts.toLocaleString()} (${(ingredientsWithRealProducts/totalIngredients*100).toFixed(1)}%)`);
    console.log(`   ❌ Unmapped Ingredients: ${Object.keys(unmappedFrequency).length} unique types`);
    
    // Top unmapped ingredients
    console.log('\n🔍 TOP UNMAPPED INGREDIENTS:');
    const frequentUnmapped = Object.entries(unmappedFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);
    
    frequentUnmapped.forEach(([ingredient, count], index) => {
      console.log(`   ${index + 1}. ${ingredient} (${count} recipes)`);
    });
    
    // Performance summary
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total test time: ${(totalTime/1000/60).toFixed(1)} minutes`);
    console.log(`📈 Average time per recipe: ${(totalTime/TOTAL_RECIPES).toFixed(0)}ms`);
    console.log(`💾 Cache hits: ${mappingCache.size} mappings, ${productCache.size} products`);
    
    // Save detailed results
    const results = {
      totalIngredients,
      mappedIngredients,
      ingredientsWithRealProducts,
      unmappedCount: Object.keys(unmappedFrequency).length,
      coverage: (mappedIngredients/totalIngredients*100).toFixed(1),
      realProductCoverage: (ingredientsWithRealProducts/totalIngredients*100).toFixed(1),
      topUnmapped: frequentUnmapped.slice(0, 50),
      auditTime: totalTime,
      recipesProcessed: TOTAL_RECIPES,
      cacheStats: {
        mappingCacheSize: mappingCache.size,
        productCacheSize: productCache.size
      }
    };
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to ${RESULTS_FILE}`);
    
    // Phase 3A Test Assessment
    console.log('\n✅ PHASE 3A TEST ASSESSMENT:');
    const coverage = (mappedIngredients/totalIngredients*100);
    const realProductCoverage = (ingredientsWithRealProducts/totalIngredients*100);
    
    if (coverage >= 90) {
      console.log(`   🎯 EXCELLENT: ${coverage.toFixed(1)}% mapping coverage`);
      console.log(`   🏪 GOOD: ${realProductCoverage.toFixed(1)}% real product coverage`);
      console.log(`   ✅ Logic is ready for full Phase 3A audit`);
    } else if (coverage >= 80) {
      console.log(`   🎯 GOOD: ${coverage.toFixed(1)}% mapping coverage`);
      console.log(`   🏪 ACCEPTABLE: ${realProductCoverage.toFixed(1)}% real product coverage`);
      console.log(`   ✅ Logic is ready for full Phase 3A audit`);
    } else {
      console.log(`   ⚠️  NEEDS IMPROVEMENT: ${coverage.toFixed(1)}% mapping coverage`);
      console.log(`   🏪 LOW: ${realProductCoverage.toFixed(1)}% real product coverage`);
      console.log(`   🔧 Recommend fixing issues before full audit`);
    }
    
    // Performance validation
    const avgTimePerRecipe = totalTime / TOTAL_RECIPES;
    const estimatedFullTime = (73322 * avgTimePerRecipe) / 1000 / 60; // minutes
    
    console.log(`\n📊 PERFORMANCE PROJECTION FOR FULL AUDIT:`);
    console.log(`   ⏱️  Estimated time for 73,322 recipes: ${estimatedFullTime.toFixed(1)} minutes`);
    console.log(`   📈 Average time per recipe: ${avgTimePerRecipe.toFixed(0)}ms`);
    console.log(`   💾 Cache efficiency: ${mappingCache.size} mappings cached`);
    
  } catch (error) {
    console.error('❌ Phase 3A test failed:', error);
  } finally {
    await db.close();
    process.exit(0);
  }
}

// Process a single recipe with caching
async function processRecipe(recipe) {
  const ingredients = await db.query(`
    SELECT i.name, i.quantity
    FROM "Ingredients" i
    WHERE i."RecipeId" = :recipeId
  `, {
    replacements: { recipeId: recipe.id },
    type: Sequelize.QueryTypes.SELECT
  });
  
  let totalIngredients = 0;
  let mappedIngredients = 0;
  let ingredientsWithRealProducts = 0;
  let unmappedFrequency = {};
  
  for (const ingredient of ingredients) {
    if (ingredient.name) {
      totalIngredients++;
      const cleanedName = cleanIngredientName(ingredient.name);
      
      // Check cache first
      let mapping = mappingCache.get(cleanedName);
      if (!mapping) {
        mapping = await findCanonicalMapping(cleanedName);
        mappingCache.set(cleanedName, mapping);
      }

      if (!mapping || !mapping.name) {
        const key = cleanedName.toLowerCase();
        unmappedFrequency[key] = (unmappedFrequency[key] || 0) + 1;
        continue;
      }
      
      mappedIngredients++;
      
      // Check for real products (with caching)
      let hasRealProducts = productCache.get(mapping.name);
      if (hasRealProducts === undefined) {
        const realProducts = await db.query(`
          SELECT COUNT(*) as count
          FROM "Food"
          WHERE "canonicalTag" = :canonicalName
            AND "brandOwner" != 'Generic'
          LIMIT 1
        `, {
          replacements: { canonicalName: mapping.name },
          type: Sequelize.QueryTypes.SELECT
        });
        
        hasRealProducts = realProducts[0].count > 0;
        productCache.set(mapping.name, hasRealProducts);
      }
      
      if (hasRealProducts) {
        ingredientsWithRealProducts++;
      }
    }
  }
  
  return {
    totalIngredients,
    mappedIngredients,
    ingredientsWithRealProducts,
    unmappedFrequency
  };
}

// Enhanced: Find canonical by name or alias, always resolve to core canonical
async function findCanonicalMapping(cleanedName) {
  // First try exact match in IngredientToCanonical
  const exactMatch = await db.query(`
    SELECT ci.id, ci.name, ci.aliases
    FROM "IngredientToCanonicals" itc
    JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
    WHERE LOWER(itc."messyName") = :name
    LIMIT 1
  `, {
    replacements: { name: cleanedName },
    type: Sequelize.QueryTypes.SELECT
  });
  if (exactMatch.length > 0) {
    return { id: exactMatch[0].id, name: exactMatch[0].name };
  }
  
  // Try partial match
  const partialMatch = await db.query(`
    SELECT ci.id, ci.name, ci.aliases
    FROM "IngredientToCanonicals" itc
    JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
    WHERE LOWER(itc."messyName") LIKE :name
    LIMIT 1
  `, {
    replacements: { name: `%${cleanedName}%` },
    type: Sequelize.QueryTypes.SELECT
  });
  if (partialMatch.length > 0) {
    return { id: partialMatch[0].id, name: partialMatch[0].name };
  }
  
  // Try canonical name or alias match
  const canonicalMatch = await db.query(`
    SELECT ci.id, ci.name, ci.aliases
    FROM "CanonicalIngredients" ci
    WHERE LOWER(ci.name) = :name OR (ci.aliases IS NOT NULL AND EXISTS (SELECT 1 FROM unnest(ci.aliases) a WHERE LOWER(a) = :name))
    LIMIT 1
  `, {
    replacements: { name: cleanedName },
    type: Sequelize.QueryTypes.SELECT
  });
  if (canonicalMatch.length > 0) {
    return { id: canonicalMatch[0].id, name: canonicalMatch[0].name };
  }
  
  // Try LIKE match for aliases (for partials)
  const aliasLikeMatch = await db.query(`
    SELECT ci.id, ci.name, ci.aliases
    FROM "CanonicalIngredients" ci
    WHERE EXISTS (SELECT 1 FROM unnest(ci.aliases) a WHERE LOWER(a) LIKE :name)
    LIMIT 1
  `, {
    replacements: { name: `%${cleanedName}%` },
    type: Sequelize.QueryTypes.SELECT
  });
  if (aliasLikeMatch.length > 0) {
    return { id: aliasLikeMatch[0].id, name: aliasLikeMatch[0].name };
  }
  
  return null;
}

testPhase3a1000(); 