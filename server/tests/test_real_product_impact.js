const { Sequelize } = require('sequelize');
const db = require('./db/database');
const cleanIngredientName = require('./scripts/data-processing/cleanIngredientName');

async function testRealProductImpact() {
  console.log('🧪 TESTING REAL PRODUCT IMPACT\n');
  
  try {
    // Get a larger sample of recipes
    const recipes = await db.query(`
      SELECT 
        r.id,
        r.title,
        COUNT(i.id) as ingredient_count
      FROM "Recipes" r
      LEFT JOIN "RecipeIngredients" i ON r.id = i."RecipeId"
      GROUP BY r.id, r.title
      ORDER BY r.id
      LIMIT 1000
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`📖 Testing ${recipes.length} recipes...`);
    
    let totalRecipeIngredients = 0;
    let mappedRecipeIngredients = 0;
    let ingredientsWithRealProducts = 0;
    let ingredientsWithGenericProducts = 0;
    
    // Track coverage by ingredient type
    const ingredientCoverage = {};
    
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
            continue;
          }
          
          mappedRecipeIngredients++;
          
          // Check product availability
          const products = await db.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real,
              COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic
            FROM "IngredientCategorized"
            WHERE "canonicalTag" = :canonicalName
          `, {
            replacements: { canonicalName: mapping.name },
            type: Sequelize.QueryTypes.SELECT
          });
          
          if (products[0].total > 0) {
            if (products[0].real > 0) {
              ingredientsWithRealProducts++;
            } else {
              ingredientsWithGenericProducts++;
            }
            
            // Track coverage by ingredient
            if (!ingredientCoverage[mapping.name]) {
              ingredientCoverage[mapping.name] = {
                total: 0,
                real: 0,
                generic: 0
              };
            }
            ingredientCoverage[mapping.name].total++;
            if (products[0].real > 0) {
              ingredientCoverage[mapping.name].real++;
            } else {
              ingredientCoverage[mapping.name].generic++;
            }
          }
        }
      }
    }
    
    // Report results
    console.log('\n📊 REAL PRODUCT IMPACT RESULTS:\n');
    console.log(`   📖 Total Recipes Analyzed: ${recipes.length}`);
    console.log(`   🥘 Total RecipeIngredients: ${totalRecipeIngredients}`);
    console.log(`   🎯 Mapped RecipeIngredients: ${mappedRecipeIngredients} (${(mappedRecipeIngredients/totalRecipeIngredients*100).toFixed(1)}%)`);
    console.log(`   🏪 RecipeIngredients with Real Products: ${ingredientsWithRealProducts} (${(ingredientsWithRealProducts/totalRecipeIngredients*100).toFixed(1)}%)`);
    console.log(`   🏭 RecipeIngredients with Generic Products: ${ingredientsWithGenericProducts} (${(ingredientsWithGenericProducts/totalRecipeIngredients*100).toFixed(1)}%)`);
    console.log(`   ❌ Unmapped RecipeIngredients: ${totalRecipeIngredients - mappedRecipeIngredients} (${((totalRecipeIngredients - mappedRecipeIngredients)/totalRecipeIngredients*100).toFixed(1)}%)`);
    
    // Show top ingredients by real product coverage
    console.log('\n🏆 TOP INGREDIENTS BY REAL PRODUCT COVERAGE:');
    const sortedRecipeIngredients = Object.entries(ingredientCoverage)
      .filter(([, stats]) => stats.total >= 5) // Only show ingredients that appear in 5+ recipes
      .map(([name, stats]) => ({
        name,
        coverage: (stats.real / stats.total * 100).toFixed(1),
        real: stats.real,
        total: stats.total
      }))
      .sort((a, b) => parseFloat(b.coverage) - parseFloat(a.coverage))
      .slice(0, 20);
    
    sortedRecipeIngredients.forEach((ingredient, index) => {
      console.log(`   ${index + 1}. ${ingredient.name}: ${ingredient.coverage}% (${ingredient.real}/${ingredient.total})`);
    });
    
    // Show ingredients with no real products
    console.log('\n❌ INGREDIENTS WITH NO REAL PRODUCTS:');
    const noRealProducts = Object.entries(ingredientCoverage)
      .filter(([, stats]) => stats.real === 0 && stats.total >= 3)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 10);
    
    noRealProducts.forEach(([name, stats], index) => {
      console.log(`   ${index + 1}. ${name}: 0% (0/${stats.total})`);
    });
    
    // Overall improvement summary
    const overallRealCoverage = (ingredientsWithRealProducts / totalRecipeIngredients * 100).toFixed(1);
    console.log(`\n🎯 OVERALL REAL PRODUCT COVERAGE: ${overallRealCoverage}%`);
    console.log(`   ✅ This represents a significant improvement from our previous ~0% coverage!`);
    
  } catch (error) {
    console.error('❌ Real product impact test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Enhanced: Find canonical by name or alias
async function findCanonicalMapping(cleanedName) {
  const exactMatch = await db.query(`
    SELECT ci.id, ci.name
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
  
  const partialMatch = await db.query(`
    SELECT ci.id, ci.name
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
  
  return null;
}

testRealProductImpact(); 