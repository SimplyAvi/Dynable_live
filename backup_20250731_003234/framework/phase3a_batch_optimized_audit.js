const { Sequelize } = require('sequelize');
const db = require('./db/database');
const cleanIngredientName = require('./scripts/data-processing/cleanIngredientName');
const fs = require('fs');
const pLimit = require('p-limit').default;

const BATCH_SIZE = 1000; // Number of recipes per batch
const PARALLEL_LIMIT = 20; // Number of recipes to process in parallel
const RESULTS_FILE = 'phase3a_batch_optimized_results.json';

async function phase3aBatchOptimizedAudit() {
  console.log('🚀 PHASE 3A: BATCH-OPTIMIZED AUDIT (ALL RECIPES)\n');
  await db.authenticate();
  console.log('✅ Database connected\n');

  // 1. Preload all mappings (messyName → canonical)
  console.log('⏳ Preloading all ingredient-to-canonical mappings...');
  const allMappings = await db.query(`
    SELECT "messyName", "IngredientId" FROM "IngredientToCanonicals"
  `, { type: Sequelize.QueryTypes.SELECT });
  const mappingMap = new Map();
  allMappings.forEach(m => mappingMap.set(m.messyName.toLowerCase(), m.IngredientId));

  // 2. Preload all canonicals (id → name)
  const allCanonicals = await db.query(`
    SELECT id, name FROM "CanonicalRecipeIngredients"
  `, { type: Sequelize.QueryTypes.SELECT });
  const canonicalMap = new Map();
  allCanonicals.forEach(c => canonicalMap.set(c.id, c.name));

  // 3. Preload real product counts (canonicalTag → count)
  console.log('⏳ Preloading real product counts...');
  const realProductCounts = await db.query(`
    SELECT "canonicalTag", COUNT(*) as count
    FROM "IngredientCategorized"
    WHERE "brandOwner" != 'Generic'
    GROUP BY "canonicalTag"
  `, { type: Sequelize.QueryTypes.SELECT });
  const realProductMap = new Map();
  realProductCounts.forEach(r => realProductMap.set(r.canonicalTag, parseInt(r.count)));

  // 4. Get total number of recipes
  const totalRecipesResult = await db.query('SELECT COUNT(*) as count FROM "Recipes"', { type: Sequelize.QueryTypes.SELECT });
  const TOTAL_RECIPES = parseInt(totalRecipesResult[0].count);
  console.log(`📊 Total recipes: ${TOTAL_RECIPES}`);

  let totalRecipeIngredients = 0;
  let mappedRecipeIngredients = 0;
  let ingredientsWithRealProducts = 0;
  let unmappedFrequency = {};

  const startTime = Date.now();
  const limit = pLimit(PARALLEL_LIMIT);

  // Track raw ingredients that clean to empty
  const emptyCleanedLog = [];

  for (let offset = 0; offset < TOTAL_RECIPES; offset += BATCH_SIZE) {
    const batchStart = Date.now();
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_RECIPES - offset);
    console.log(`\n🔄 Processing batch: recipes ${offset + 1}-${offset + currentBatchSize} (${Math.round((offset/TOTAL_RECIPES)*100)}% complete)`);

    // 5. Fetch recipes and all their ingredients in this batch
    const recipes = await db.query(`
      SELECT r.id, r.title
      FROM "Recipes" r
      ORDER BY r.id
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { limit: currentBatchSize, offset },
      type: Sequelize.QueryTypes.SELECT
    });
    const recipeIds = recipes.map(r => r.id);
    const ingredients = await db.query(`
      SELECT i.id, i.name, i."RecipeId"
      FROM "RecipeIngredients" i
      WHERE i."RecipeId" IN (:ids)
    `, {
      replacements: { ids: recipeIds },
      type: Sequelize.QueryTypes.SELECT
    });
    // Group ingredients by recipe
    const ingredientsByRecipe = {};
    for (const ing of ingredients) {
      if (!ingredientsByRecipe[ing.RecipeId]) ingredientsByRecipe[ing.RecipeId] = [];
      ingredientsByRecipe[ing.RecipeId].push(ing);
    }

    // 6. Process recipes in parallel
    await Promise.all(recipes.map(recipe => limit(async () => {
      const ings = ingredientsByRecipe[recipe.id] || [];
      for (const ingredient of ings) {
        if (!ingredient.name) continue;
        totalRecipeIngredients++;
        const messyName = ingredient.name;
        const cleanedName = cleanIngredientName(messyName);
        if (!cleanedName) {
          emptyCleanedLog.push(messyName);
          continue; // skip empty cleaned ingredients
        }
        // Find canonical mapping
        const canonicalId = mappingMap.get(cleanedName.toLowerCase());
        if (!canonicalId) {
          // Track unmapped
          const key = cleanedName.toLowerCase();
          unmappedFrequency[key] = (unmappedFrequency[key] || 0) + 1;
          continue;
        }
        mappedRecipeIngredients++;
        const canonical = canonicalMap.get(canonicalId);
        // Check for real products
        const realProductCount = realProductMap.get(canonical) || 0;
        if (realProductCount > 0) ingredientsWithRealProducts++;
      }
    })));

    const batchTime = Date.now() - batchStart;
    const avgTimePerRecipe = batchTime / currentBatchSize;
    const remainingRecipes = TOTAL_RECIPES - (offset + currentBatchSize);
    const estimatedTimeRemaining = (remainingRecipes * avgTimePerRecipe) / 1000 / 60; // minutes
    console.log(`   ⏱️  Batch completed in ${(batchTime/1000).toFixed(1)}s (${avgTimePerRecipe.toFixed(0)}ms per recipe)`);
    console.log(`   📈 Current coverage: ${mappedRecipeIngredients}/${totalRecipeIngredients} (${(mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1)}%)`);
    console.log(`   🏪 Real products: ${ingredientsWithRealProducts}/${totalRecipeIngredients} (${(ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1)}%)`);
    console.log(`   ⏳ Estimated time remaining: ${estimatedTimeRemaining.toFixed(1)} minutes`);
  }

  // After processing all recipes, log the empty-cleaned ingredients
  if (emptyCleanedLog.length > 0) {
    fs.writeFileSync('empty_cleaned_ingredients.log', emptyCleanedLog.map(x => `"${x}"`).join('\n'));
    console.log(`\n📝 Logged ${emptyCleanedLog.length} raw ingredients that cleaned to empty in empty_cleaned_ingredients.log`);
  }

  // Final analysis
  console.log('\n🎯 PHASE 3A BATCH-OPTIMIZED FINAL RESULTS');
  console.log(`   📊 Total RecipeIngredients: ${totalRecipeIngredients.toLocaleString()}`);
  console.log(`   🎯 Mapped RecipeIngredients: ${mappedRecipeIngredients.toLocaleString()} (${(mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1)}%)`);
  console.log(`   🏪 RecipeIngredients with Real Products: ${ingredientsWithRealProducts.toLocaleString()} (${(ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1)}%)`);
  console.log(`   ❌ Unmapped RecipeIngredients: ${Object.keys(unmappedFrequency).length} unique types`);

  // Top unmapped ingredients
  console.log('\n🔍 TOP UNMAPPED INGREDIENTS:');
  const frequentUnmapped = Object.entries(unmappedFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 30);
  frequentUnmapped.forEach(([ingredient, count], index) => {
    console.log(`   ${index + 1}. ${ingredient} (${count} recipes)`);
  });

  // Performance summary
  const totalTime = Date.now() - startTime;
  console.log(`\n⏱️  Total audit time: ${(totalTime/1000/60).toFixed(1)} minutes`);
  console.log(`📈 Average time per recipe: ${(totalTime/TOTAL_RECIPES).toFixed(0)}ms`);

  // Save detailed results
  const results = {
    totalRecipeIngredients,
    mappedRecipeIngredients,
    ingredientsWithRealProducts,
    unmappedCount: Object.keys(unmappedFrequency).length,
    coverage: (mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1),
    realProductCoverage: (ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1),
    topUnmapped: frequentUnmapped,
    auditTime: totalTime,
    recipesProcessed: TOTAL_RECIPES
  };
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to ${RESULTS_FILE}`);

  await db.close();
}

phase3aBatchOptimizedAudit(); 