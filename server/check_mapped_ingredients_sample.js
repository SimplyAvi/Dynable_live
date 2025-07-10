const { Sequelize } = require('sequelize');
const db = require('./db/database');
const cleanIngredientName = require('./scripts/data-processing/cleanIngredientName');

const TOTAL_RECIPES = 1000;

async function checkMappedIngredientsSample() {
  console.log('🔍 CHECKING SAMPLED MAPPED INGREDIENTS (1,000 recipes)\n');
  await db.authenticate();
  console.log('✅ Database connected\n');

  // Collect mapping stats
  const mappingStats = {};
  const mappedSamples = [];

  // Get recipes
  const recipes = await db.query(`
    SELECT r.id, r.title
    FROM "Recipes" r
    ORDER BY r.id
    LIMIT :limit
  `, {
    replacements: { limit: TOTAL_RECIPES },
    type: Sequelize.QueryTypes.SELECT
  });

  for (const recipe of recipes) {
    const ingredients = await db.query(`
      SELECT i.name
      FROM "Ingredients" i
      WHERE i."RecipeId" = :recipeId
    `, {
      replacements: { recipeId: recipe.id },
      type: Sequelize.QueryTypes.SELECT
    });

    for (const ingredient of ingredients) {
      if (!ingredient.name) continue;
      const messyName = ingredient.name;
      const cleanedName = cleanIngredientName(messyName);
      // Find canonical mapping
      const mapping = await db.query(`
        SELECT ci.name as canonical
        FROM "IngredientToCanonicals" itc
        JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
        WHERE LOWER(itc."messyName") = :name
        LIMIT 1
      `, {
        replacements: { name: cleanedName },
        type: Sequelize.QueryTypes.SELECT
      });
      if (mapping.length === 0) continue;
      const canonical = mapping[0].canonical;
      // Count real products
      const realProducts = await db.query(`
        SELECT COUNT(*) as count
        FROM "Food"
        WHERE "canonicalTag" = :canonical
          AND "brandOwner" != 'Generic'
      `, {
        replacements: { canonical },
        type: Sequelize.QueryTypes.SELECT
      });
      const realProductCount = realProducts[0].count;
      // Track frequency
      const key = `${messyName} | ${cleanedName} | ${canonical}`;
      mappingStats[key] = mappingStats[key] || { messyName, cleanedName, canonical, realProductCount, count: 0 };
      mappingStats[key].count++;
      // Save sample for random
      mappedSamples.push({ messyName, cleanedName, canonical, realProductCount });
    }
  }

  // Top 20 most frequent mappings
  const topMappings = Object.values(mappingStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  console.log('📊 Top 20 Most Frequent Mappings:');
  console.table(topMappings.map(m => ({
    'Messy Name': m.messyName,
    'Cleaned Name': m.cleanedName,
    'Canonical': m.canonical,
    'Real Products': m.realProductCount,
    'Count': m.count
  })));

  // Random sample of 20 mappings
  const shuffled = mappedSamples.sort(() => 0.5 - Math.random());
  const randomSample = shuffled.slice(0, 20);

  console.log('\n🎲 Random Sample of 20 Mappings:');
  console.table(randomSample.map(m => ({
    'Messy Name': m.messyName,
    'Cleaned Name': m.cleanedName,
    'Canonical': m.canonical,
    'Real Products': m.realProductCount
  })));

  await db.close();
}

checkMappedIngredientsSample(); 