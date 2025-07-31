const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { IngredientCategorized, Ingredient } = require('./db/models');

async function phase2ProductOptimization() {
  console.log('🚀 PHASE 2: PRODUCT OPTIMIZATION\n');
  
  try {
    // Step 1: Map untagged real products to canonicals
    console.log('1️⃣ MAPPING UNTAGGED REAL PRODUCTS');
    
    const untaggedProducts = await db.query(`
      SELECT id, description, "brandOwner", "brandName"
      FROM "IngredientCategorized"
      WHERE "brandOwner" != 'Generic' 
        AND "canonicalTag" IS NULL
        AND "description" IS NOT NULL
      LIMIT 100
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`   📦 Found ${untaggedProducts.length} untagged real products to process`);
    
    let mappedCount = 0;
    for (const product of untaggedProducts) {
      // Find matching canonical based on description
      const matchingCanonical = await findMatchingCanonical(product.description);
      
      if (matchingCanonical) {
        try {
          await db.query(`
            UPDATE "IngredientCategorized"
            SET "canonicalTag" = :canonicalName, "canonicalTagConfidence" = 'suggested'
            WHERE id = :productId
          `, {
            replacements: {
              canonicalName: matchingCanonical,
              productId: product.id
            }
          });
          
          console.log(`   ✅ Mapped: "${product.description.substring(0, 50)}..." → ${matchingCanonical}`);
          mappedCount++;
        } catch (error) {
          console.log(`   ❌ Failed to map product ${product.id}: ${error.message}`);
        }
      }
    }
    
    console.log(`   📊 Successfully mapped ${mappedCount}/${untaggedProducts.length} products`);

    // Step 2: Find real products for generic-only canonicals
    console.log('\n2️⃣ FINDING REAL PRODUCTS FOR GENERIC-ONLY CANONICALS');
    
    const genericOnlyCanonicals = await db.query(`
      SELECT ci.name, COUNT(f.id) as product_count
      FROM "CanonicalRecipeIngredients" ci
      LEFT JOIN "IngredientCategorized" f ON ci.name = f."canonicalTag"
      GROUP BY ci.id, ci.name
      HAVING COUNT(CASE WHEN f."brandOwner" != 'Generic' THEN 1 END) = 0
        AND COUNT(f.id) > 0
      ORDER BY product_count DESC
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });
    
    let realProductsFound = 0;
    for (const canonical of genericOnlyCanonicals) {
      const potentialProducts = await findRealProductsForCanonical(canonical.name);
      
      if (potentialProducts.length > 0) {
        console.log(`   ✅ ${canonical.name}: Found ${potentialProducts.length} potential real products`);
        
        // Map the best matches
        for (const product of potentialProducts.slice(0, 3)) { // Map top 3
          try {
            await db.query(`
              UPDATE "IngredientCategorized"
              SET "canonicalTag" = :canonicalName, "canonicalTagConfidence" = 'suggested'
              WHERE id = :productId
            `, {
              replacements: {
                canonicalName: canonical.name,
                productId: product.id
              }
            });
            
            console.log(`      🏪 Mapped: ${product.brandName || product.brandOwner} - ${product.description.substring(0, 40)}...`);
            realProductsFound++;
          } catch (error) {
            console.log(`      ❌ Failed to map product ${product.id}`);
          }
        }
      } else {
        console.log(`   ⚠️  ${canonical.name}: No real products found`);
      }
    }
    
    console.log(`   📊 Added ${realProductsFound} real products to generic-only canonicals`);

    // Step 3: Remove unnecessary generic products
    console.log('\n3️⃣ CLEANING UP UNNECESSARY GENERIC PRODUCTS');
    
    const redundantGenerics = await db.query(`
      SELECT f.id, f."canonicalTag", COUNT(real_products.id) as real_count
      FROM "IngredientCategorized" f
      LEFT JOIN "IngredientCategorized" real_products ON f."canonicalTag" = real_products."canonicalTag" 
        AND real_products."brandOwner" != 'Generic'
      WHERE f."brandOwner" = 'Generic'
        AND f."canonicalTag" IS NOT NULL
      GROUP BY f.id, f."canonicalTag"
      HAVING COUNT(real_products.id) >= 3
      LIMIT 50
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`   🧹 Found ${redundantGenerics.length} generic products with 3+ real alternatives`);
    
    let removedCount = 0;
    for (const generic of redundantGenerics) {
      try {
        await db.query(`DELETE FROM "IngredientCategorized" WHERE id = :id`, {
          replacements: { id: generic.id }
        });
        removedCount++;
      } catch (error) {
        console.log(`   ❌ Failed to remove generic product ${generic.id}`);
      }
    }
    
    console.log(`   📊 Removed ${removedCount} redundant generic products`);

    // Step 4: Summary
    console.log('\n4️⃣ PHASE 2 SUMMARY');
    console.log(`   ✅ Mapped ${mappedCount} untagged real products`);
    console.log(`   ✅ Added ${realProductsFound} real products to generic-only canonicals`);
    console.log(`   ✅ Removed ${removedCount} redundant generic products`);
    
    // Calculate improvement
    const beforeStats = await getProductStats();
    console.log(`   📈 Real product coverage: ${beforeStats.realPercent.toFixed(1)}%`);
    
    console.log('\n   🎯 Next Steps:');
    console.log('      - Run Phase 3: Recipe Validation');
    console.log('      - Test specific recipes for coverage');
    console.log('      - Validate allergen filtering');

  } catch (error) {
    console.error('❌ Phase 2 failed:', error);
  } finally {
    process.exit(0);
  }
}

async function findMatchingCanonical(description) {
  // Simple keyword matching - can be enhanced with more sophisticated logic
  const keywords = description.toLowerCase().split(/\s+/);
  
  for (const keyword of keywords) {
    if (keyword.length > 3) { // Skip short words
      const canonical = await db.query(`
        SELECT name FROM "CanonicalRecipeIngredients"
        WHERE LOWER(name) LIKE :keyword
        LIMIT 1
      `, {
        replacements: { keyword: `%${keyword}%` },
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (canonical.length > 0) {
        return canonical[0].name;
      }
    }
  }
  
  return null;
}

async function findRealProductsForCanonical(canonicalName) {
  const keywords = canonicalName.toLowerCase().split(/\s+/);
  const searchPatterns = keywords.map(k => `%${k}%`);
  
  let allProducts = [];
  for (const pattern of searchPatterns) {
    const products = await db.query(`
      SELECT id, description, "brandOwner", "brandName"
      FROM "IngredientCategorized"
      WHERE "brandOwner" != 'Generic'
        AND "canonicalTag" IS NULL
        AND LOWER("description") LIKE :pattern
      LIMIT 5
    `, {
      replacements: { pattern },
      type: Sequelize.QueryTypes.SELECT
    });
    
    allProducts = allProducts.concat(products);
  }
  
  // Remove duplicates and return unique products
  const uniqueProducts = allProducts.filter((product, index, self) => 
    index === self.findIndex(p => p.id === product.id)
  );
  
  return uniqueProducts.slice(0, 5); // Return top 5
}

async function getProductStats() {
  const stats = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real_products
    FROM "IngredientCategorized"
  `, { type: Sequelize.QueryTypes.SELECT });
  
  const data = stats[0];
  return {
    total: data.total,
    realProducts: data.real_products,
    realPercent: (data.real_products / data.total) * 100
  };
}

phase2ProductOptimization(); 