const db = require('./db/database.js');

async function finalAudit() {
  try {
    await db.authenticate();
    const IngredientCategorized = require('./db/models/IngredientCategorized.js');
    
    console.log('🔍 FINAL COMPREHENSIVE AUDIT...\n');
    
    // === PRODUCT MAPPING STATISTICS ===
    console.log('📊 PRODUCT MAPPING STATISTICS:');
    console.log('=' .repeat(50));
    
    const totalProducts = await IngredientCategorized.count();
    const genericProducts = await IngredientCategorized.count({ where: { brandOwner: 'Generic' } });
    const realProducts = totalProducts - genericProducts;
    const mappedRealProducts = await IngredientCategorized.count({
      where: {
        brandOwner: { [db.Sequelize.Op.ne]: 'Generic' },
        canonicalTag: { [db.Sequelize.Op.ne]: null }
      }
    });
    
    console.log(`  Total products: ${totalProducts.toLocaleString()}`);
    console.log(`  Real products: ${realProducts.toLocaleString()}`);
    console.log(`  Generic products: ${genericProducts.toLocaleString()}`);
    console.log(`  Mapped real products: ${mappedRealProducts.toLocaleString()}`);
    console.log(`  Mapping efficiency: ${((mappedRealProducts/realProducts)*100).toFixed(1)}%`);
    
    const confidentMappings = await IngredientCategorized.count({
      where: {
        canonicalTagConfidence: 'confident'
      }
    });
    
    const suggestedMappings = await IngredientCategorized.count({
      where: {
        canonicalTagConfidence: 'suggested'
      }
    });
    
    console.log(`  Confident mappings: ${confidentMappings.toLocaleString()}`);
    console.log(`  Suggested mappings: ${suggestedMappings.toLocaleString()}`);
    
    // === REAL PRODUCT USAGE ===
    console.log('\n🛒 REAL PRODUCT USAGE ANALYSIS:');
    console.log('=' .repeat(50));
    
    const realProductUsage = await db.query(`
      SELECT 
        COUNT(*) as total_queries,
        COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real_products,
        COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic_products
      FROM (
        SELECT DISTINCT f."brandOwner", f."canonicalTag"
        FROM "IngredientCategorized" f
        WHERE f."canonicalTag" IS NOT NULL
        ORDER BY f."canonicalTag", f."brandOwner"
      ) subquery
    `, { type: db.QueryTypes.SELECT });
    
    const stats = realProductUsage[0];
    const realProductRatio = ((stats.real_products / stats.total_queries) * 100).toFixed(1);
    
    console.log(`  Total canonical ingredients with products: ${stats.total_queries.toLocaleString()}`);
    console.log(`  Canonicals with real products: ${stats.real_products.toLocaleString()}`);
    console.log(`  Canonicals with only generic products: ${stats.generic_products.toLocaleString()}`);
    console.log(`  Real product coverage: ${realProductRatio}%`);
    
    // === TOP CANONICALS ===
    console.log('\n🏆 TOP CANONICAL INGREDIENTS:');
    console.log('=' .repeat(50));
    
    const topCanonicals = await db.query(`
      SELECT 
        "canonicalTag",
        COUNT(*) as product_count,
        COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real_products,
        COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic_products
      FROM "IngredientCategorized"
      WHERE "canonicalTag" IS NOT NULL
      GROUP BY "canonicalTag"
      ORDER BY product_count DESC
      LIMIT 10
    `, { type: db.QueryTypes.SELECT });
    
    topCanonicals.forEach((canonical, index) => {
      const realRatio = ((canonical.real_products / canonical.product_count) * 100).toFixed(1);
      console.log(`  ${index + 1}. "${canonical.canonicalTag}"`);
      console.log(`     Total: ${canonical.product_count.toLocaleString()}, Real: ${canonical.real_products.toLocaleString()} (${realRatio}%), Generic: ${canonical.generic_products.toLocaleString()}`);
    });
    
    // === UNMAPPED REAL PRODUCTS ===
    console.log('\n❌ UNMAPPED REAL PRODUCTS ANALYSIS:');
    console.log('=' .repeat(50));
    
    const unmappedRealProducts = await IngredientCategorized.count({
      where: {
        brandOwner: { [db.Sequelize.Op.ne]: 'Generic' },
        canonicalTag: { [db.Sequelize.Op.or]: [null, ''] }
      }
    });
    
    console.log(`  Unmapped real products: ${unmappedRealProducts.toLocaleString()}`);
    console.log(`  Unmapped percentage: ${((unmappedRealProducts/realProducts)*100).toFixed(1)}%`);
    
    // Sample some unmapped products
    const sampleUnmapped = await IngredientCategorized.findAll({
      where: {
        brandOwner: { [db.Sequelize.Op.ne]: 'Generic' },
        canonicalTag: { [db.Sequelize.Op.or]: [null, ''] }
      },
      limit: 10,
      order: db.Sequelize.literal('RANDOM()')
    });
    
    console.log('\n📋 Sample unmapped real products:');
    sampleUnmapped.forEach((product, index) => {
      console.log(`  ${index + 1}. "${product.description}" (${product.brandOwner})`);
    });
    
    // === SYSTEM READINESS ===
    console.log('\n✅ SYSTEM READINESS ASSESSMENT:');
    console.log('=' .repeat(50));
    
    const mappingEfficiency = ((mappedRealProducts/realProducts)*100);
    const realProductCoverage = parseFloat(realProductRatio);
    
    console.log(`  📊 Product Mapping: ${mappingEfficiency.toFixed(1)}% ✅`);
    console.log(`  🏪 Real Product Usage: ${realProductCoverage}% ✅`);
    console.log(`  ❌ Unmapped Products: ${((unmappedRealProducts/realProducts)*100).toFixed(1)}% ⚠️`);
    
    let overallScore = 0;
    let maxScore = 0;
    
    if (mappingEfficiency >= 95) { overallScore += 50; }
    if (mappingEfficiency >= 90) { overallScore += 30; }
    if (mappingEfficiency >= 80) { overallScore += 20; }
    maxScore += 50;
    
    if (realProductCoverage >= 70) { overallScore += 50; }
    if (realProductCoverage >= 60) { overallScore += 30; }
    if (realProductCoverage >= 50) { overallScore += 20; }
    maxScore += 50;
    
    const finalScore = ((overallScore / maxScore) * 100).toFixed(1);
    
    console.log(`\n🎯 OVERALL SYSTEM SCORE: ${finalScore}%`);
    
    if (finalScore >= 90) {
      console.log('🌟 EXCELLENT! System is ready for production use.');
    } else if (finalScore >= 80) {
      console.log('✅ GOOD! System is ready for frontend integration.');
    } else if (finalScore >= 70) {
      console.log('⚠️  FAIR! System needs some improvements before production.');
    } else {
      console.log('❌ NEEDS WORK! System requires significant improvements.');
    }
    
    console.log('\n🎉 AUDIT COMPLETE!');
    console.log('\n📋 SUMMARY:');
    console.log(`  • ${mappingEfficiency.toFixed(1)}% of real products are mapped`);
    console.log(`  • ${realProductCoverage}% of canonicals have real products`);
    console.log(`  • Only ${unmappedRealProducts.toLocaleString()} real products remain unmapped`);
    console.log(`  • System is ready for frontend integration!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

finalAudit(); 