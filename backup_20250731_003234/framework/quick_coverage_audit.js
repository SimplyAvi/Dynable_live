const { IngredientToCanonical, Recipe, Ingredient } = require('./db/models');
const fs = require('fs');
const path = require('path');

// Baseline from last audit
const BASELINE_COVERAGE = 41.65;
const SAMPLE_SIZE = 500;

function getMemoryUsageMB() {
  const mem = process.memoryUsage();
  return (mem.rss / 1024 / 1024).toFixed(1);
}

async function quickCoverageAudit() {
  console.log('🚀 Quick Coverage Audit (True Recipe Sample)');
  console.log('======================');
  const startTime = Date.now();

  // Load all mappings into memory
  const mappings = await IngredientToCanonical.findAll({ attributes: ['messyName'] });
  const mappedSet = new Set(mappings.map(m => m.messyName.toLowerCase()));
  console.log(`Loaded ${mappedSet.size} mapped messyNames into memory.`);

  // Sample 500 random recipes with their ingredients
  const recipes = await Recipe.findAll({
    order: [ [Recipe.sequelize.fn('RANDOM')] ],
    limit: SAMPLE_SIZE,
    include: [{ model: Ingredient, attributes: ['name'] }]
  });
  console.log(`Sampled ${recipes.length} random recipes.`);

  let totalRecipeIngredients = 0;
  let mappedRecipeIngredients = 0;

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const ingredients = recipe.RecipeIngredients || recipe.ingredients || [];
    for (const ing of ingredients) {
      totalRecipeIngredients++;
      const name = (ing.name || '').toLowerCase();
      if (mappedSet.has(name)) mappedRecipeIngredients++;
    }
    if ((i + 1) % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Checked ${i + 1}/${SAMPLE_SIZE} recipes | Mem: ${getMemoryUsageMB()}MB | Time: ${elapsed}s`);
    }
  }

  const coverage = totalRecipeIngredients === 0 ? 0 : ((mappedRecipeIngredients / totalRecipeIngredients) * 100).toFixed(2);
  const improvement = (coverage - BASELINE_COVERAGE).toFixed(2);

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n===== Coverage Audit Summary =====');
  console.log(`Before: ${BASELINE_COVERAGE}%`);
  console.log(`After:  ${coverage}%`);
  console.log(`Improvement: +${improvement} percentage points`);
  console.log(`ROI: 114 mappings → +${improvement}% coverage boost`);
  console.log(`Total ingredients checked: ${totalRecipeIngredients}`);
  console.log(`Mapped: ${mappedRecipeIngredients}`);
  console.log(`⏱️  Total time: ${totalElapsed}s | Mem: ${getMemoryUsageMB()}MB`);
  console.log('==================================');
}

if (require.main === module) {
  quickCoverageAudit();
}

module.exports = { quickCoverageAudit }; 