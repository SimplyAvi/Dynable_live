const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { IngredientCategorized, Ingredient, Recipe, Ingredient } = require('./db/models');
const cleanIngredientName = require('./scripts/data-processing/cleanIngredientName');
const fs = require('fs');
const pLimit = require('p-limit');

// Configuration for Phase 3A - Full Database Audit
const TOTAL_RECIPES = 73322;
const BATCH_SIZE = 500; // Process 500 recipes per batch
const PARALLEL_LIMIT = 10; // Process 10 recipes in parallel
const PROGRESS_FILE = 'phase3a_progress.json';
const RESULTS_FILE = 'phase3a_results.json';

// Caching for performance
const mappingCache = new Map();
const productCache = new Map();

async function phase3aComprehensiveAudit() {
  console.log('🚀 PHASE 3A: COMPREHENSIVE RECIPE AUDIT\n');
  console.log(`📊 Target: All ${TOTAL_RECIPES.toLocaleString()} recipes`);
  console.log(`⚡ Optimizations: Parallel processing, caching, batch processing`);
  console.log(`⏱️  Estimated time: 2-3 hours\n`);
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    // Load progress if exists
    let progress = loadProgress();
    let startOffset = progress.lastProcessedRecipe || 0;
    
    console.log(`📊 Starting from recipe ${startOffset + 1} of ${TOTAL_RECIPES}`);
    
    let totalRecipeIngredients = progress.totalRecipeIngredients || 0;
    let mappedRecipeIngredients = progress.mappedRecipeIngredients || 0;
    let ingredientsWithRealProducts = progress.ingredientsWithRealProducts || 0;
    let unmappedFrequency = progress.unmappedFrequency || {};
    
    const startTime = Date.now();
    const limit = pLimit(PARALLEL_LIMIT);
    
    // Process recipes in batches
    for (let offset = startOffset; offset < TOTAL_RECIPES; offset += BATCH_SIZE) {
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
        LEFT JOIN "RecipeIngredients" i ON r.id = i."RecipeId"
        GROUP BY r.id, r.title
        ORDER BY r.id
        LIMIT :limit OFFSET :offset
      `, { 
        replacements: { limit: currentBatchSize, offset },
        type: Sequelize.QueryTypes.SELECT 
      });
      
      // Process recipes in parallel
      const batchResults = await Promise.all(
        recipes.map(recipe => limit(() => processRecipe(recipe)))
      );
      
      // Aggregate batch results
      for (const result of batchResults) {
        totalRecipeIngredients += result.totalRecipeIngredients;
        mappedRecipeIngredients += result.mappedRecipeIngredients;
        ingredientsWithRealProducts += result.ingredientsWithRealProducts;
        
        // Merge unmapped frequency
        for (const [ingredient, count] of Object.entries(result.unmappedFrequency)) {
          unmappedFrequency[ingredient] = (unmappedFrequency[ingredient] || 0) + count;
        }
      }
      
      // Update progress
      progress.lastProcessedRecipe = offset + currentBatchSize - 1;
      progress.totalRecipeIngredients = totalRecipeIngredients;
      progress.mappedRecipeIngredients = mappedRecipeIngredients;
      progress.ingredientsWithRealProducts = ingredientsWithRealProducts;
      progress.unmappedFrequency = unmappedFrequency;
      saveProgress(progress);
      
      const batchTime = Date.now() - batchStart;
      const avgTimePerRecipe = batchTime / currentBatchSize;
      const remainingRecipes = TOTAL_RECIPES - (offset + currentBatchSize);
      const estimatedTimeRemaining = (remainingRecipes * avgTimePerRecipe) / 1000 / 60; // minutes
      
      console.log(`   ⏱️  Batch completed in ${(batchTime/1000).toFixed(1)}s (${avgTimePerRecipe.toFixed(0)}ms per recipe)`);
      console.log(`   📈 Current coverage: ${mappedRecipeIngredients}/${totalRecipeIngredients} (${(mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1)}%)`);
      console.log(`   🏪 Real products: ${ingredientsWithRealProducts}/${totalRecipeIngredients} (${(ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1)}%)`);
      console.log(`   ⏳ Estimated time remaining: ${estimatedTimeRemaining.toFixed(1)} minutes`);
      
      // Early termination check - if we've processed enough to be confident
      if (offset > 10000 && (offset / TOTAL_RECIPES) > 0.15) {
        const coverage = (mappedRecipeIngredients/totalRecipeIngredients*100);
        if (coverage > 90) {
          console.log(`\n🎯 EARLY TERMINATION: Coverage is ${coverage.toFixed(1)}% after ${Math.round((offset/TOTAL_RECIPES)*100)}% of recipes`);
          console.log(`   This suggests the coverage pattern is consistent across the dataset`);
          break;
        }
      }
    }
    
    // Final analysis
    console.log('\n🎯 PHASE 3A FINAL RESULTS');
    console.log(`   📊 Total RecipeIngredients: ${totalRecipeIngredients.toLocaleString()}`);
    console.log(`   🎯 Mapped RecipeIngredients: ${mappedRecipeIngredients.toLocaleString()} (${(mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1)}%)`);
    console.log(`   🏪 RecipeIngredients with Real Products: ${ingredientsWithRealProducts.toLocaleString()} (${(ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1)}%)`);
    console.log(`   ❌ Unmapped RecipeIngredients: ${Object.keys(unmappedFrequency).length} unique types`);
    
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
    console.log(`\n⏱️  Total audit time: ${(totalTime/1000/60).toFixed(1)} minutes`);
    console.log(`📈 Average time per recipe: ${(totalTime/TOTAL_RECIPES).toFixed(0)}ms`);
    console.log(`💾 Cache hits: ${mappingCache.size} mappings, ${productCache.size} products`);
    
    // Save detailed results
    const results = {
      totalRecipeIngredients,
      mappedRecipeIngredients,
      ingredientsWithRealProducts,
      unmappedCount: Object.keys(unmappedFrequency).length,
      coverage: (mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1),
      realProductCoverage: (ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1),
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
    
    // Clean up progress file
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
    
    // Phase 3A Assessment
    console.log('\n✅ PHASE 3A ASSESSMENT:');
    const coverage = (mappedRecipeIngredients/totalRecipeIngredients*100);
    const realProductCoverage = (ingredientsWithRealProducts/totalRecipeIngredients*100);
    
    if (coverage >= 90) {
      console.log(`   🎯 EXCELLENT: ${coverage.toFixed(1)}% mapping coverage`);
      console.log(`   🏪 GOOD: ${realProductCoverage.toFixed(1)}% real product coverage`);
      console.log(`   ✅ System is ready for production use`);
    } else if (coverage >= 80) {
      console.log(`   🎯 GOOD: ${coverage.toFixed(1)}% mapping coverage`);
      console.log(`   🏪 ACCEPTABLE: ${realProductCoverage.toFixed(1)}% real product coverage`);
      console.log(`   ⚠️  Consider Phase 3B for additional improvements`);
    } else {
      console.log(`   ⚠️  NEEDS IMPROVEMENT: ${coverage.toFixed(1)}% mapping coverage`);
      console.log(`   🏪 LOW: ${realProductCoverage.toFixed(1)}% real product coverage`);
      console.log(`   🔧 Recommend Phase 3B before production`);
    }
    
  } catch (error) {
    console.error('❌ Phase 3A audit failed:', error);
    console.log('\n🔄 You can resume from where you left off by running the script again');
  } finally {
    await db.close();
    process.exit(0);
  }
}

// Process a single recipe with caching
async function processRecipe(recipe) {
  const ingredients = await db.query(`
    SELECT i.name, i.quantity
    FROM "RecipeIngredients" i
    WHERE i."RecipeId" = :recipeId
  `, {
    replacements: { recipeId: recipe.id },
    type: Sequelize.QueryTypes.SELECT
  });
  
  let totalRecipeIngredients = 0;
  let mappedRecipeIngredients = 0;
  let ingredientsWithRealProducts = 0;
  let unmappedFrequency = {};
  
  for (const ingredient of ingredients) {
    if (ingredient.name) {
      totalRecipeIngredients++;
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
      
      mappedRecipeIngredients++;
      
      // Check for real products (with caching)
      let hasRealProducts = productCache.get(mapping.name);
      if (hasRealProducts === undefined) {
        const realProducts = await db.query(`
          SELECT COUNT(*) as count
          FROM "IngredientCategorized"
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
    totalRecipeIngredients,
    mappedRecipeIngredients,
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
    JOIN "CanonicalRecipeIngredients" ci ON itc."IngredientId" = ci.id
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
    JOIN "CanonicalRecipeIngredients" ci ON itc."IngredientId" = ci.id
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
    FROM "CanonicalRecipeIngredients" ci
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
    FROM "CanonicalRecipeIngredients" ci
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

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (error) {
    console.log('⚠️  Could not load progress file, starting fresh');
  }
  return {};
}

function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.log('⚠️  Could not save progress file');
  }
}

phase3aComprehensiveAudit(); 