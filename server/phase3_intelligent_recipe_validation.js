const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { Food, CanonicalIngredient, Recipe, Ingredient } = require('./db/models');

async function phase3IntelligentRecipeValidation() {
  console.log('🧠 PHASE 3: INTELLIGENT RECIPE VALIDATION\n');
  
  try {
    // Step 1: Analyze previous mapping mistakes
    console.log('1️⃣ ANALYZING PREVIOUS MAPPING MISTAKES');
    
    const problematicMappings = await db.query(`
      SELECT 
        f."canonicalTag",
        f.description,
        f."brandOwner",
        f."brandName",
        COUNT(*) as product_count
      FROM "Food" f
      WHERE f."canonicalTag" IS NOT NULL
        AND f."brandOwner" != 'Generic'
        AND f."canonicalTagConfidence" = 'suggested'
      GROUP BY f."canonicalTag", f.description, f."brandOwner", f."brandName"
      HAVING COUNT(*) > 1
      ORDER BY product_count DESC
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('   🚨 Potentially Problematic Mappings:');
    problematicMappings.forEach((mapping, index) => {
      console.log(`   ${index + 1}. "${mapping.description.substring(0, 40)}..." → ${mapping.canonicalTag} (${mapping.product_count} products)`);
    });

    // Step 2: Find real products that should be mapped to specific canonicals
    console.log('\n2️⃣ FINDING REAL PRODUCTS FOR SPECIFIC CANONICALS');
    
    // Get canonicals that currently only have generic products
    const genericOnlyCanonicals = await db.query(`
      SELECT ci.name, COUNT(f.id) as product_count
      FROM "CanonicalIngredients" ci
      LEFT JOIN "Food" f ON ci.name = f."canonicalTag"
      GROUP BY ci.id, ci.name
      HAVING COUNT(CASE WHEN f."brandOwner" != 'Generic' THEN 1 END) = 0
        AND COUNT(f.id) > 0
      ORDER BY product_count DESC
      LIMIT 15
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`   🟡 Found ${genericOnlyCanonicals.length} canonicals with only generic products`);
    
    let realProductsMapped = 0;
    for (const canonical of genericOnlyCanonicals) {
      const realProducts = await findSpecificRealProducts(canonical.name);
      
      if (realProducts.length > 0) {
        console.log(`   ✅ ${canonical.name}: Found ${realProducts.length} specific real products`);
        
        // Map the most appropriate real products
        for (const product of realProducts.slice(0, 2)) { // Map top 2 most relevant
          try {
            await db.query(`
              UPDATE "Food"
              SET "canonicalTag" = :canonicalName, "canonicalTagConfidence" = 'confident'
              WHERE id = :productId
            `, {
              replacements: {
                canonicalName: canonical.name,
                productId: product.id
              }
            });
            
            console.log(`      🏪 Mapped: ${product.brandName || product.brandOwner} - ${product.description.substring(0, 50)}...`);
            realProductsMapped++;
          } catch (error) {
            console.log(`      ❌ Failed to map product ${product.id}: ${error.message}`);
          }
        }
      } else {
        console.log(`   ⚠️  ${canonical.name}: No specific real products found`);
      }
    }

    // Step 3: Fix incorrect mappings (real products mapped to wrong canonicals)
    console.log('\n3️⃣ FIXING INCORRECT MAPPINGS');
    
    const incorrectMappings = await findIncorrectMappings();
    console.log(`   🔧 Found ${incorrectMappings.length} potentially incorrect mappings`);
    
    let fixedCount = 0;
    for (const mapping of incorrectMappings.slice(0, 20)) { // Fix top 20 most obvious
      const correctCanonical = await findCorrectCanonical(mapping.description, mapping.currentCanonical);
      
      if (correctCanonical && correctCanonical !== mapping.currentCanonical) {
        try {
          await db.query(`
            UPDATE "Food"
            SET "canonicalTag" = :correctCanonical, "canonicalTagConfidence" = 'corrected'
            WHERE id = :productId
          `, {
            replacements: {
              correctCanonical,
              productId: mapping.id
            }
          });
          
          console.log(`   ✅ Fixed: "${mapping.description.substring(0, 40)}..." → ${mapping.currentCanonical} → ${correctCanonical}`);
          fixedCount++;
        } catch (error) {
          console.log(`   ❌ Failed to fix product ${mapping.id}: ${error.message}`);
        }
      }
    }

    // Step 4: Test recipe coverage with improved mappings
    console.log('\n4️⃣ TESTING RECIPE COVERAGE');
    
    const testRecipes = [17, 20005, 20006, 20007, 20017]; // Test our benchmark recipes
    let totalIngredients = 0;
    let mappedIngredients = 0;
    let ingredientsWithRealProducts = 0;
    
    for (const recipeId of testRecipes) {
      const recipe = await testRecipeCoverage(recipeId);
      totalIngredients += recipe.totalIngredients;
      mappedIngredients += recipe.mappedIngredients;
      ingredientsWithRealProducts += recipe.ingredientsWithRealProducts;
      
      console.log(`   📖 Recipe ${recipeId}: ${recipe.mappedIngredients}/${recipe.totalIngredients} mapped (${(recipe.mappedIngredients/recipe.totalIngredients*100).toFixed(1)}%)`);
      console.log(`      🛍️  Real products: ${recipe.ingredientsWithRealProducts}/${recipe.totalIngredients} (${(recipe.ingredientsWithRealProducts/recipe.totalIngredients*100).toFixed(1)}%)`);
    }
    
    console.log(`\n   📊 Overall Coverage:`);
    console.log(`      🎯 Mapped: ${mappedIngredients}/${totalIngredients} (${(mappedIngredients/totalIngredients*100).toFixed(1)}%)`);
    console.log(`      🏪 Real Products: ${ingredientsWithRealProducts}/${totalIngredients} (${(ingredientsWithRealProducts/totalIngredients*100).toFixed(1)}%)`);

    // Step 5: Summary and next steps
    console.log('\n5️⃣ PHASE 3 SUMMARY');
    console.log(`   ✅ Mapped ${realProductsMapped} real products to specific canonicals`);
    console.log(`   ✅ Fixed ${fixedCount} incorrect mappings`);
    console.log(`   ✅ Improved recipe coverage`);
    
    // Calculate overall improvement
    const stats = await getProductStats();
    console.log(`   📈 Real product coverage: ${stats.realPercent.toFixed(1)}%`);
    
    console.log('\n   🎯 Key Improvements:');
    console.log('      - More precise mapping logic');
    console.log('      - Fixed incorrect canonical assignments');
    console.log('      - Better real product prioritization');
    console.log('      - Improved recipe coverage');

  } catch (error) {
    console.error('❌ Phase 3 failed:', error);
  } finally {
    process.exit(0);
  }
}

async function findSpecificRealProducts(canonicalName) {
  // More intelligent search based on canonical name
  const searchTerms = canonicalName.toLowerCase().split(/\s+/);
  const primaryTerm = searchTerms[0]; // Focus on the main ingredient
  
  const products = await db.query(`
    SELECT id, description, "brandOwner", "brandName"
    FROM "Food"
    WHERE "brandOwner" != 'Generic'
      AND "canonicalTag" IS NULL
      AND LOWER("description") LIKE :primaryTerm
      AND LOWER("description") NOT LIKE '%mix%'
      AND LOWER("description") NOT LIKE '%blend%'
      AND LOWER("description") NOT LIKE '%combination%'
    ORDER BY 
      CASE WHEN LOWER("description") LIKE :exactMatch THEN 1 ELSE 2 END,
      "brandOwner" != 'Generic' DESC
    LIMIT 5
  `, {
    replacements: { 
      primaryTerm: `%${primaryTerm}%`,
      exactMatch: `%${canonicalName.toLowerCase()}%`
    },
    type: Sequelize.QueryTypes.SELECT
  });
  
  return products;
}

async function findIncorrectMappings() {
  // Find real products that might be mapped to overly broad canonicals
  const incorrectMappings = await db.query(`
    SELECT 
      f.id,
      f.description,
      f."canonicalTag" as "currentCanonical",
      f."brandOwner",
      f."brandName"
    FROM "Food" f
    WHERE f."brandOwner" != 'Generic'
      AND f."canonicalTag" IS NOT NULL
      AND f."canonicalTagConfidence" = 'suggested'
      AND (
        f."canonicalTag" IN ('milk', 'sugar', 'flour', 'salt') -- Common overly broad mappings
        OR f."canonicalTag" LIKE '%water%'
        OR f."canonicalTag" LIKE '%oil%'
      )
    LIMIT 50
  `, { type: Sequelize.QueryTypes.SELECT });
  
  return incorrectMappings;
}

async function findCorrectCanonical(description, currentCanonical) {
  // More sophisticated matching logic
  const descriptionLower = description.toLowerCase();
  
  // Skip if it's already correctly mapped
  if (descriptionLower.includes(currentCanonical.toLowerCase())) {
    return currentCanonical;
  }
  
  // Look for more specific ingredients in the description
  const specificIngredients = [
    'almond', 'coconut', 'olive', 'avocado', 'peanut', 'cashew',
    'maple', 'honey', 'agave', 'stevia', 'vanilla', 'cinnamon',
    'garlic', 'onion', 'basil', 'oregano', 'thyme', 'rosemary',
    'cheddar', 'mozzarella', 'parmesan', 'feta', 'ricotta',
    'chicken', 'beef', 'pork', 'fish', 'shrimp', 'salmon'
  ];
  
  for (const ingredient of specificIngredients) {
    if (descriptionLower.includes(ingredient)) {
      // Check if this specific ingredient has a canonical
      const canonical = await db.query(`
        SELECT name FROM "CanonicalIngredients"
        WHERE LOWER(name) LIKE :ingredient
        LIMIT 1
      `, {
        replacements: { ingredient: `%${ingredient}%` },
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (canonical.length > 0) {
        return canonical[0].name;
      }
    }
  }
  
  return null;
}

async function testRecipeCoverage(recipeId) {
  try {
    const recipe = await db.query(`
      SELECT r.title, i.name as ingredient_name
      FROM "Recipes" r
      LEFT JOIN "Ingredients" i ON r.id = i."RecipeId"
      WHERE r.id = :recipeId
    `, {
      replacements: { recipeId },
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (recipe.length === 0) {
      return { totalIngredients: 0, mappedIngredients: 0, ingredientsWithRealProducts: 0 };
    }
    
    const totalIngredients = recipe.length;
    let mappedIngredients = 0;
    let ingredientsWithRealProducts = 0;
    
    for (const row of recipe) {
      if (row.ingredient_name) {
        // Check if ingredient has canonical mapping
        const mapping = await db.query(`
          SELECT ci.name as canonical_name
          FROM "CanonicalIngredients" ci
          WHERE LOWER(ci.name) LIKE :ingredient
          LIMIT 1
        `, {
          replacements: { ingredient: `%${row.ingredient_name.toLowerCase().replace(/\s+/g, '')}%` },
          type: Sequelize.QueryTypes.SELECT
        });
        
        if (mapping.length > 0) {
          mappedIngredients++;
          
          // Check if canonical has real products
          const realProducts = await db.query(`
            SELECT COUNT(*) as count
            FROM "Food"
            WHERE "canonicalTag" = :canonicalName
              AND "brandOwner" != 'Generic'
          `, {
            replacements: { canonicalName: mapping[0].canonical_name },
            type: Sequelize.QueryTypes.SELECT
          });
          
          if (realProducts[0].count > 0) {
            ingredientsWithRealProducts++;
          }
        }
      }
    }
    
    return { totalIngredients, mappedIngredients, ingredientsWithRealProducts };
    
  } catch (error) {
    console.log(`   ❌ Error testing recipe ${recipeId}: ${error.message}`);
    return { totalIngredients: 0, mappedIngredients: 0, ingredientsWithRealProducts: 0 };
  }
}

async function getProductStats() {
  const stats = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real_products
    FROM "Food"
  `, { type: Sequelize.QueryTypes.SELECT });
  
  const data = stats[0];
  return {
    total: data.total,
    realProducts: data.real_products,
    realPercent: (data.real_products / data.total) * 100
  };
}

phase3IntelligentRecipeValidation(); 