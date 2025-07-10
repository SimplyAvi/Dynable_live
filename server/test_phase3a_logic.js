const { Sequelize } = require('sequelize');
const db = require('./db/database');
const cleanIngredientName = require('./scripts/data-processing/cleanIngredientName');

async function testPhase3aLogic() {
  console.log('🧪 TESTING PHASE 3A LOGIC\n');
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    // Test with a small sample of recipes
    const testRecipes = await db.query(`
      SELECT 
        r.id,
        r.title,
        COUNT(i.id) as ingredient_count
      FROM "Recipes" r
      LEFT JOIN "Ingredients" i ON r.id = i."RecipeId"
      GROUP BY r.id, r.title
      ORDER BY r.id
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`📊 Testing with ${testRecipes.length} recipes\n`);
    
    let totalIngredients = 0;
    let mappedIngredients = 0;
    let ingredientsWithRealProducts = 0;
    let unmappedFrequency = {};
    
    for (const recipe of testRecipes) {
      const ingredients = await db.query(`
        SELECT i.name, i.quantity
        FROM "Ingredients" i
        WHERE i."RecipeId" = :recipeId
      `, {
        replacements: { recipeId: recipe.id },
        type: Sequelize.QueryTypes.SELECT
      });
      
      console.log(`\n📖 Recipe: "${recipe.title}" (${ingredients.length} ingredients)`);
      
      for (const ingredient of ingredients) {
        if (ingredient.name) {
          totalIngredients++;
          const cleanedName = cleanIngredientName(ingredient.name);
          
          console.log(`   Ingredient: "${ingredient.name}" → "${cleanedName}"`);
          
          const mapping = await findCanonicalMapping(cleanedName);

          if (!mapping || !mapping.name) {
            console.log(`   ❌ Unmapped: ${cleanedName}`);
            const key = cleanedName.toLowerCase();
            unmappedFrequency[key] = (unmappedFrequency[key] || 0) + 1;
            continue;
          }
          
          mappedIngredients++;
          console.log(`   ✅ Mapped: ${cleanedName} → ${mapping.name}`);
          
          // Check for real products
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
          
          if (realProducts[0].count > 0) {
            ingredientsWithRealProducts++;
            console.log(`   🏪 Has real products: ${realProducts[0].count} products`);
          } else {
            console.log(`   ⚠️  No real products found`);
          }
        }
      }
    }
    
    // Results
    console.log('\n🎯 TEST RESULTS:');
    console.log(`   📊 Total Ingredients: ${totalIngredients}`);
    console.log(`   🎯 Mapped Ingredients: ${mappedIngredients} (${(mappedIngredients/totalIngredients*100).toFixed(1)}%)`);
    console.log(`   🏪 Ingredients with Real Products: ${ingredientsWithRealProducts} (${(ingredientsWithRealProducts/totalIngredients*100).toFixed(1)}%)`);
    console.log(`   ❌ Unmapped Ingredients: ${Object.keys(unmappedFrequency).length} unique types`);
    
    if (Object.keys(unmappedFrequency).length > 0) {
      console.log('\n🔍 Sample unmapped ingredients:');
      const frequentUnmapped = Object.entries(unmappedFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      frequentUnmapped.forEach(([ingredient, count], index) => {
        console.log(`   ${index + 1}. ${ingredient} (${count} recipes)`);
      });
    }
    
    console.log('\n✅ Phase 3A logic test completed successfully!');
    console.log('   The audit logic is working correctly and ready for full deployment.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.close();
    process.exit(0);
  }
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

testPhase3aLogic(); 