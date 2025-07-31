const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { IngredientCategorized, Ingredient, Recipe, Ingredient } = require('./db/models');
const cleanIngredientName = require('./scripts/data-processing/cleanIngredientName');
const fs = require('fs');

// Configuration
const BATCH_SIZE = 100;
const TOTAL_RECIPES = 1000;
const PROGRESS_FILE = 'audit_progress.json';

async function optimizedRecipeAudit() {
  console.log('🚀 OPTIMIZED RECIPE AUDIT - PHASE 1 (1,000 recipes)\n');
  
  try {
    // Load progress if exists
    let progress = loadProgress();
    let startOffset = progress.lastProcessedRecipe || 0;
    
    console.log(`📊 Starting from recipe ${startOffset + 1} of ${TOTAL_RECIPES}`);
    
    let totalRecipeIngredients = progress.totalRecipeIngredients || 0;
    let mappedRecipeIngredients = progress.mappedRecipeIngredients || 0;
    let ingredientsWithRealProducts = progress.ingredientsWithRealProducts || 0;
    let unmappedRecipeIngredients = progress.unmappedRecipeIngredients || [];
    let unmappedFrequency = progress.unmappedFrequency || {};
    
    const startTime = Date.now();
    
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
      
      // Process each recipe in batch
      for (const recipe of recipes) {
        const ingredients = await db.query(`
          SELECT i.name, i.quantity
          FROM "RecipeIngredients" i
          WHERE i."RecipeId" = :recipeId
        `, {
          replacements: { recipeId: recipe.id },
          type: Sequelize.QueryTypes.SELECT
        });
        
        totalRecipeIngredients += ingredients.length;
        
        for (const ingredient of ingredients) {
          if (ingredient.name) {
            const cleanedName = cleanIngredientName(ingredient.name);
            const mapping = await findCanonicalMapping(cleanedName);

            if (!mapping || !mapping.name) {
              unmappedRecipeIngredients.push({
                recipeId: recipe.id,
                recipeTitle: recipe.title,
                ingredient: ingredient.name,
                cleanedName
              });
              
              // Track frequency
              const key = cleanedName.toLowerCase();
              unmappedFrequency[key] = (unmappedFrequency[key] || 0) + 1;
              continue;
            }
            
            mappedRecipeIngredients++;
            
            // Check for real products (optimized query)
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
            
            if (realProducts[0].count > 0) {
              ingredientsWithRealProducts++;
            }
          }
        }
      }
      
      // Update progress
      progress.lastProcessedRecipe = offset + currentBatchSize - 1;
      progress.totalRecipeIngredients = totalRecipeIngredients;
      progress.mappedRecipeIngredients = mappedRecipeIngredients;
      progress.ingredientsWithRealProducts = ingredientsWithRealProducts;
      progress.unmappedRecipeIngredients = unmappedRecipeIngredients;
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
    }
    
    // Final analysis
    console.log('\n🎯 FINAL RESULTS (1,000 recipes)');
    console.log(`   📊 Total RecipeIngredients: ${totalRecipeIngredients}`);
    console.log(`   🎯 Mapped RecipeIngredients: ${mappedRecipeIngredients} (${(mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1)}%)`);
    console.log(`   🏪 RecipeIngredients with Real Products: ${ingredientsWithRealProducts} (${(ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1)}%)`);
    console.log(`   ❌ Unmapped RecipeIngredients: ${unmappedRecipeIngredients.length} (${(unmappedRecipeIngredients.length/totalRecipeIngredients*100).toFixed(1)}%)`);
    
    // Top unmapped ingredients
    console.log('\n🔍 TOP UNMAPPED INGREDIENTS:');
    const frequentUnmapped = Object.entries(unmappedFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15);
    
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
      unmappedCount: unmappedRecipeIngredients.length,
      coverage: (mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1),
      realProductCoverage: (ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1),
      topUnmapped: frequentUnmapped,
      auditTime: totalTime,
      recipesProcessed: TOTAL_RECIPES
    };
    
    fs.writeFileSync('audit_results_phase1.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Results saved to audit_results_phase1.json');
    
    // Clean up progress file
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
    
  } catch (error) {
    console.error('❌ Optimized audit failed:', error);
    console.log('\n🔄 You can resume from where you left off by running the script again');
  } finally {
    process.exit(0);
  }
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

optimizedRecipeAudit(); 