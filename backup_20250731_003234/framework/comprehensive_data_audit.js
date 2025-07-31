const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { IngredientCategorized, Ingredient, IngredientToCanonical, Recipe, Ingredient } = require('./db/models');

async function comprehensiveDataAudit() {
  console.log('🔍 COMPREHENSIVE DATA AUDIT\n');
  
  try {
    // 1. Database Overview
    console.log('1️⃣ DATABASE OVERVIEW');
    const totalProducts = await IngredientCategorized.count();
    const totalCanonicals = await Ingredient.count();
    const totalMappings = await IngredientToCanonical.count();
    const totalRecipes = await Recipe.count();
    
    console.log(`   📦 Total Products: ${totalProducts.toLocaleString()}`);
    console.log(`   🎯 Total Canonicals: ${totalCanonicals.toLocaleString()}`);
    console.log(`   🔗 Total Mappings: ${totalMappings.toLocaleString()}`);
    console.log(`   📖 Total Recipes: ${totalRecipes.toLocaleString()}`);

    // 2. Product Analysis
    console.log('\n2️⃣ PRODUCT ANALYSIS');
    const productStats = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real_products,
        COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic_products,
        COUNT(CASE WHEN "canonicalTag" IS NOT NULL THEN 1 END) as tagged_products,
        COUNT(CASE WHEN "canonicalTag" IS NULL THEN 1 END) as untagged_products
      FROM "IngredientCategorized"
    `, { type: db.QueryTypes.SELECT });
    
    const stats = productStats[0];
    console.log(`   📦 Total Products: ${stats.total.toLocaleString()}`);
    console.log(`   🏪 Real Products: ${stats.real_products.toLocaleString()} (${(stats.real_products/stats.total*100).toFixed(1)}%)`);
    console.log(`   🟡 Generic Products: ${stats.generic_products.toLocaleString()} (${(stats.generic_products/stats.total*100).toFixed(1)}%)`);
    console.log(`   🏷️  Tagged Products: ${stats.tagged_products.toLocaleString()} (${(stats.tagged_products/stats.total*100).toFixed(1)}%)`);
    console.log(`   ❓ Untagged Products: ${stats.untagged_products.toLocaleString()} (${(stats.untagged_products/stats.total*100).toFixed(1)}%)`);

    // 3. Canonical Coverage Analysis
    console.log('\n3️⃣ CANONICAL COVERAGE ANALYSIS');
    const canonicalStats = await db.query(`
      SELECT 
        ci.name as canonical_name,
        COUNT(f.id) as total_products,
        COUNT(CASE WHEN f."brandOwner" != 'Generic' THEN 1 END) as real_products,
        COUNT(CASE WHEN f."brandOwner" = 'Generic' THEN 1 END) as generic_products
      FROM "CanonicalRecipeIngredients" ci
      LEFT JOIN "IngredientCategorized" f ON ci.name = f."canonicalTag"
      GROUP BY ci.id, ci.name
      ORDER BY total_products DESC
      LIMIT 20
    `, { type: db.QueryTypes.SELECT });
    
    console.log('   📊 Top 20 Canonicals by Product Count:');
    canonicalStats.forEach((canonical, index) => {
      const realPercent = canonical.total_products > 0 ? (canonical.real_products/canonical.total_products*100).toFixed(1) : '0';
      console.log(`   ${index + 1}. ${canonical.canonical_name}: ${canonical.total_products} total (${canonical.real_products} real, ${realPercent}%)`);
    });

    // 4. Recipe Coverage Analysis
    console.log('\n4️⃣ RECIPE COVERAGE ANALYSIS');
    const recipeStats = await db.query(`
      SELECT 
        COUNT(DISTINCT r.id) as total_recipes,
        COUNT(DISTINCT i.id) as total_ingredients,
        COUNT(DISTINCT CASE WHEN itc."IngredientId" IS NOT NULL THEN i.id END) as mapped_ingredients,
        COUNT(DISTINCT CASE WHEN f.id IS NOT NULL THEN i.id END) as ingredients_with_products
      FROM "Recipes" r
      LEFT JOIN "RecipeIngredients" i ON r.id = i."RecipeId"
      LEFT JOIN "IngredientToCanonical" itc ON LOWER(REPLACE(i.name, ' ', '')) = itc."messyName"
      LEFT JOIN "IngredientCategorized" f ON itc."canonicalName" = f."canonicalTag"
    `, { type: db.QueryTypes.SELECT });
    
    const recipeData = recipeStats[0];
    console.log(`   📖 Total Recipes: ${recipeData.total_recipes.toLocaleString()}`);
    console.log(`   🥘 Total RecipeIngredients: ${recipeData.total_ingredients.toLocaleString()}`);
    console.log(`   🎯 Mapped RecipeIngredients: ${recipeData.mapped_ingredients.toLocaleString()} (${(recipeData.mapped_ingredients/recipeData.total_ingredients*100).toFixed(1)}%)`);
    console.log(`   🛍️  RecipeIngredients with Products: ${recipeData.ingredients_with_products.toLocaleString()} (${(recipeData.ingredients_with_products/recipeData.total_ingredients*100).toFixed(1)}%)`);

    // 5. Identify Problem Areas
    console.log('\n5️⃣ PROBLEM AREAS IDENTIFICATION');
    
    // Canonicals with only generic products
    const genericOnlyCanonicals = await db.query(`
      SELECT ci.name, COUNT(f.id) as product_count
      FROM "CanonicalRecipeIngredients" ci
      LEFT JOIN "IngredientCategorized" f ON ci.name = f."canonicalTag"
      WHERE f."brandOwner" = 'Generic' OR f.id IS NULL
      GROUP BY ci.id, ci.name
      HAVING COUNT(CASE WHEN f."brandOwner" != 'Generic' THEN 1 END) = 0
      ORDER BY product_count DESC
      LIMIT 10
    `, { type: db.QueryTypes.SELECT });
    
    console.log('   🟡 Canonicals with ONLY Generic Products:');
    genericOnlyCanonicals.forEach((canonical, index) => {
      console.log(`   ${index + 1}. ${canonical.name} (${canonical.product_count} products)`);
    });

    // Untagged real products
    const untaggedRealProducts = await db.query(`
      SELECT COUNT(*) as count
      FROM "IngredientCategorized"
      WHERE "brandOwner" != 'Generic' 
        AND "canonicalTag" IS NULL
        AND "description" IS NOT NULL
    `, { type: db.QueryTypes.SELECT });
    
    console.log(`   ❓ Untagged Real Products: ${untaggedRealProducts[0].count.toLocaleString()}`);

    // 6. Action Plan
    console.log('\n6️⃣ RECOMMENDED ACTION PLAN');
    console.log('   📋 Phase 1: Data Quality');
    console.log('      - Map untagged real products to canonicals');
    console.log('      - Clean up overly long canonical names');
    console.log('      - Remove duplicate mappings');
    
    console.log('   📋 Phase 2: Product Optimization');
    console.log('      - Find real products for generic-only canonicals');
    console.log('      - Update canonical tags for better matching');
    console.log('      - Remove unnecessary generic products');
    
    console.log('   📋 Phase 3: Recipe Validation');
    console.log('      - Test recipes systematically');
    console.log('      - Fix unmapped ingredients');
    console.log('      - Ensure real product coverage');
    
    console.log('   📋 Phase 4: Quality Assurance');
    console.log('      - Run comprehensive tests');
    console.log('      - Validate allergen filtering');
    console.log('      - Performance optimization');

    // 7. Success Metrics
    console.log('\n7️⃣ SUCCESS METRICS');
    const targetRealProducts = Math.floor(stats.total * 0.85); // 85% target
    const targetTaggedProducts = Math.floor(stats.total * 0.95); // 95% target
    
    console.log(`   🎯 Target Real Products: ${targetRealProducts.toLocaleString()} (85%)`);
    console.log(`   🎯 Target Tagged Products: ${targetTaggedProducts.toLocaleString()} (95%)`);
    console.log(`   📈 Real Products Needed: ${(targetRealProducts - stats.real_products).toLocaleString()}`);
    console.log(`   📈 Tagged Products Needed: ${(targetTaggedProducts - stats.tagged_products).toLocaleString()}`);

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    process.exit(0);
  }
}

comprehensiveDataAudit(); 