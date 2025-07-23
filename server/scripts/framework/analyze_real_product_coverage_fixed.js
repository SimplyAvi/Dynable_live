const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function analyzeRealProductCoverageFixed() {
  console.log('🔍 CORRECTED REAL PRODUCT COVERAGE ANALYSIS\n');
  
  try {
    // Get all canonical ingredients with their product counts (FIXED LOGIC)
    const canonicals = await db.query(`
      SELECT 
        ci.name,
        ci.id,
        COUNT(f.id) as total_products,
        COUNT(CASE WHEN f."brandOwner" != 'Generic' THEN 1 END) as real_products,
        COUNT(CASE WHEN f."brandOwner" = 'Generic' THEN 1 END) as generic_products,
        COUNT(CASE WHEN f."brandOwner" IS NULL OR f."brandOwner" = '' THEN 1 END) as null_products
      FROM "CanonicalRecipeIngredients" ci
      LEFT JOIN "IngredientCategorized" f ON f."canonicalTag" = ci.name
      GROUP BY ci.id, ci.name
      ORDER BY real_products ASC, total_products DESC
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`📊 Found ${canonicals.length} canonical ingredients\n`);
    
    // Categorize by coverage (FIXED)
    const noRealProducts = canonicals.filter(c => c.real_products == 0);
    const someRealProducts = canonicals.filter(c => c.real_products > 0 && c.real_products < 5);
    const goodRealProducts = canonicals.filter(c => c.real_products >= 5);
    
    console.log('📈 COVERAGE BREAKDOWN (FIXED):');
    console.log(`   ❌ No real products: ${noRealProducts.length} canonicals`);
    console.log(`   ⚠️  Limited real products (1-4): ${someRealProducts.length} canonicals`);
    console.log(`   ✅ Good real products (5+): ${goodRealProducts.length} canonicals`);
    
    // Show top priorities (no real products, high frequency)
    console.log('\n🎯 TOP PRIORITIES (No Real Products):');
    noRealProducts.slice(0, 20).forEach((canonical, index) => {
      console.log(`   ${index + 1}. ${canonical.name} (${canonical.total_products} total, ${canonical.generic_products} generic, ${canonical.null_products} null)`);
    });
    
    // Show limited real products
    console.log('\n⚠️  LIMITED REAL PRODUCTS (1-4):');
    someRealProducts.slice(0, 15).forEach((canonical, index) => {
      console.log(`   ${index + 1}. ${canonical.name} (${canonical.real_products} real, ${canonical.total_products} total)`);
    });
    
    // Calculate overall coverage
    const totalCanonicals = canonicals.length;
    const canonicalsWithRealProducts = goodRealProducts.length + someRealProducts.length;
    const coveragePercentage = (canonicalsWithRealProducts / totalCanonicals * 100).toFixed(1);
    
    console.log(`\n📊 OVERALL COVERAGE:`);
    console.log(`   ${canonicalsWithRealProducts}/${totalCanonicals} canonicals have real products (${coveragePercentage}%)`);
    
    // Check some specific examples
    console.log('\n🔍 SAMPLE ANALYSIS:');
    const sampleCanonicals = ['salt', 'sugar', 'flour', 'butter', 'eggs'];
    for (const name of sampleCanonicals) {
      const result = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real,
          COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic,
          COUNT(CASE WHEN "brandOwner" IS NULL OR "brandOwner" = '' THEN 1 END) as null_count
        FROM "IngredientCategorized" 
        WHERE "canonicalTag" = :name
      `, {
        replacements: { name },
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (result[0]) {
        console.log(`   ${name}: ${result[0].real} real, ${result[0].generic} generic, ${result[0].null_count} null (${result[0].total} total)`);
      }
    }
    
    // Save detailed results
    const results = {
      totalCanonicals,
      canonicalsWithRealProducts,
      coveragePercentage,
      noRealProducts: noRealProducts.map(c => ({ 
        name: c.name, 
        totalProducts: c.total_products,
        genericProducts: c.generic_products,
        nullProducts: c.null_products
      })),
      limitedRealProducts: someRealProducts.map(c => ({ 
        name: c.name, 
        realProducts: c.real_products, 
        totalProducts: c.total_products 
      })),
      goodRealProducts: goodRealProducts.map(c => ({ 
        name: c.name, 
        realProducts: c.real_products, 
        totalProducts: c.total_products 
      }))
    };
    
    const fs = require('fs');
    fs.writeFileSync('real_product_analysis_fixed.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Corrected analysis saved to real_product_analysis_fixed.json');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    process.exit(0);
  }
}

analyzeRealProductCoverageFixed(); 