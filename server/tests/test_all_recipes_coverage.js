const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function testAllRecipesCoverage() {
  console.log('🔍 COMPREHENSIVE ALL-RECIPES COVERAGE TEST\n');
  
  try {
    // Get total recipe count
    const totalRecipes = await db.query('SELECT COUNT(*) as count FROM "Recipes"', { type: Sequelize.QueryTypes.SELECT });
    console.log(`📊 Total Recipes in Database: ${totalRecipes[0].count.toLocaleString()}\n`);
    
    // Test different recipe ranges
    const testRanges = [
      { name: 'Early Recipes (1-1000)', start: 1, end: 1000, sample: 50 },
      { name: 'Mid Recipes (10000-11000)', start: 10000, end: 11000, sample: 50 },
      { name: 'Late Recipes (50000-51000)', start: 50000, end: 51000, sample: 50 },
      { name: 'Recent Recipes (70000-71000)', start: 70000, end: 71000, sample: 50 },
      { name: 'Random Sample (All ranges)', start: 1, end: totalRecipes[0].count, sample: 100 }
    ];
    
    let overallTotalIngredients = 0;
    let overallMappedIngredients = 0;
    let overallWithRealProducts = 0;
    
    for (const range of testRanges) {
      console.log(`1️⃣ Testing ${range.name}...`);
      
      // Get sample recipes from this range
      const recipes = await db.query(`
        SELECT r.id, r.title, COUNT(i.id) as ingredient_count
        FROM "Recipes" r
        LEFT JOIN "Ingredients" i ON r.id = i."RecipeId"
        WHERE r.id >= :startId AND r.id <= :endId
        GROUP BY r.id, r.title
        ORDER BY RANDOM()
        LIMIT :sample
      `, {
        replacements: { 
          startId: range.start, 
          endId: range.end, 
          sample: range.sample 
        },
        type: Sequelize.QueryTypes.SELECT
      });
      
      let rangeTotalIngredients = 0;
      let rangeMappedIngredients = 0;
      let rangeWithRealProducts = 0;
      
      for (const recipe of recipes) {
        const ingredients = await db.query(`
          SELECT i.name, i.quantity
          FROM "Ingredients" i
          WHERE i."RecipeId" = :recipeId
        `, {
          replacements: { recipeId: recipe.id },
          type: Sequelize.QueryTypes.SELECT
        });
        
        rangeTotalIngredients += ingredients.length;
        overallTotalIngredients += ingredients.length;
        
        for (const ingredient of ingredients) {
          if (ingredient.name) {
            const cleanedName = cleanIngredientName(ingredient.name);
            const mapping = await findCanonicalMapping(cleanedName);
            
            if (mapping) {
              rangeMappedIngredients++;
              overallMappedIngredients++;
              
              // Check if canonical has real products
              const realProducts = await db.query(`
                SELECT COUNT(*) as count
                FROM "Food"
                WHERE "canonicalTag" = :canonicalName
                  AND "brandOwner" != 'Generic'
              `, {
                replacements: { canonicalName: mapping },
                type: Sequelize.QueryTypes.SELECT
              });
              
              if (realProducts[0].count > 0) {
                rangeWithRealProducts++;
                overallWithRealProducts++;
              }
            }
          }
        }
      }
      
      console.log(`   📊 ${range.name}:`);
      console.log(`      🎯 Mapped: ${rangeMappedIngredients}/${rangeTotalIngredients} (${(rangeMappedIngredients/rangeTotalIngredients*100).toFixed(1)}%)`);
      console.log(`      🏪 Real Products: ${rangeWithRealProducts}/${rangeTotalIngredients} (${(rangeWithRealProducts/rangeTotalIngredients*100).toFixed(1)}%)`);
      console.log(`      📖 Sample size: ${recipes.length} recipes\n`);
    }
    
    // Overall summary
    console.log('2️⃣ OVERALL COVERAGE SUMMARY');
    console.log(`   📊 Total Ingredients Tested: ${overallTotalIngredients.toLocaleString()}`);
    console.log(`   🎯 Overall Mapping Coverage: ${overallMappedIngredients}/${overallTotalIngredients} (${(overallMappedIngredients/overallTotalIngredients*100).toFixed(1)}%)`);
    console.log(`   🏪 Overall Real Product Coverage: ${overallWithRealProducts}/${overallTotalIngredients} (${(overallWithRealProducts/overallTotalIngredients*100).toFixed(1)}%)`);
    
    // Test specific recipe types
    console.log('\n3️⃣ TESTING SPECIFIC RECIPE TYPES');
    
    const recipeTypes = [
      { name: 'Pizza Recipes', query: 'title ILIKE \'%pizza%\'' },
      { name: 'Burger Recipes', query: 'title ILIKE \'%burger%\'' },
      { name: 'Pasta Recipes', query: 'title ILIKE \'%pasta%\'' },
      { name: 'Salad Recipes', query: 'title ILIKE \'%salad%\'' },
      { name: 'Dessert Recipes', query: 'title ILIKE \'%cake%\' OR title ILIKE \'%cookie%\'' }
    ];
    
    for (const type of recipeTypes) {
      const typeRecipes = await db.query(`
        SELECT r.id, r.title, COUNT(i.id) as ingredient_count
        FROM "Recipes" r
        LEFT JOIN "Ingredients" i ON r.id = i."RecipeId"
        WHERE ${type.query}
        GROUP BY r.id, r.title
        ORDER BY RANDOM()
        LIMIT 20
      `, { type: Sequelize.QueryTypes.SELECT });
      
      if (typeRecipes.length > 0) {
        let typeTotalIngredients = 0;
        let typeMappedIngredients = 0;
        
        for (const recipe of typeRecipes) {
          const ingredients = await db.query(`
            SELECT i.name
            FROM "Ingredients" i
            WHERE i."RecipeId" = :recipeId
          `, {
            replacements: { recipeId: recipe.id },
            type: Sequelize.QueryTypes.SELECT
          });
          
          typeTotalIngredients += ingredients.length;
          
          for (const ingredient of ingredients) {
            if (ingredient.name) {
              const cleanedName = cleanIngredientName(ingredient.name);
              const mapping = await findCanonicalMapping(cleanedName);
              
              if (mapping) {
                typeMappedIngredients++;
              }
            }
          }
        }
        
        console.log(`   🍕 ${type.name}: ${typeMappedIngredients}/${typeTotalIngredients} (${(typeMappedIngredients/typeTotalIngredients*100).toFixed(1)}%)`);
      }
    }
    
    // Final assessment
    console.log('\n4️⃣ FINAL ASSESSMENT');
    const overallCoverage = (overallMappedIngredients/overallTotalIngredients*100);
    
    if (overallCoverage >= 95) {
      console.log('   🎉 EXCELLENT: Coverage is consistently high across all recipe ranges!');
      console.log('   ✅ Our canonical mapping system works for ALL recipes');
    } else if (overallCoverage >= 80) {
      console.log('   👍 GOOD: Coverage is good but some ranges need attention');
      console.log('   ⚠️  Some recipe ranges may have lower coverage');
    } else {
      console.log('   ⚠️  NEEDS WORK: Coverage varies significantly across ranges');
      console.log('   🔧 Some recipe ranges need additional mapping work');
    }
    
    console.log(`\n   📈 Coverage by Range:`);
    console.log(`      Early Recipes: High coverage expected`);
    console.log(`      Mid Recipes: Should match overall average`);
    console.log(`      Late Recipes: Should match overall average`);
    console.log(`      Recent Recipes: Should match overall average`);
    console.log(`      Random Sample: Representative of entire database`);

  } catch (error) {
    console.error('❌ All-recipes coverage test failed:', error);
  } finally {
    process.exit(0);
  }
}

function cleanIngredientName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

async function findCanonicalMapping(cleanedName) {
  const exactMatch = await db.query(`
    SELECT ci.name
    FROM "IngredientToCanonicals" itc
    JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
    WHERE LOWER(itc."messyName") = :name
    LIMIT 1
  `, {
    replacements: { name: cleanedName },
    type: Sequelize.QueryTypes.SELECT
  });
  
  if (exactMatch.length > 0) {
    return exactMatch[0].name;
  }
  
  // Try partial match
  const partialMatch = await db.query(`
    SELECT ci.name
    FROM "IngredientToCanonicals" itc
    JOIN "CanonicalIngredients" ci ON itc."CanonicalIngredientId" = ci.id
    WHERE LOWER(itc."messyName") LIKE :name
    LIMIT 1
  `, {
    replacements: { name: `%${cleanedName}%` },
    type: Sequelize.QueryTypes.SELECT
  });
  
  if (partialMatch.length > 0) {
    return partialMatch[0].name;
  }
  
  return null;
}

testAllRecipesCoverage(); 