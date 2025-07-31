const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function analyzeRealProductCoverage() {
  console.log('🔍 ANALYZING REAL PRODUCT COVERAGE\n');
  
  try {
    // Get all canonical ingredients with their product counts
    const canonicals = await db.query(`
      SELECT 
        ci.name,
        ci.id,
        COUNT(f.id) as total_products,
        COUNT(CASE WHEN f."brandOwner" != 'Generic' THEN 1 END) as real_products,
        COUNT(CASE WHEN f."brandOwner" = 'Generic' THEN 1 END) as generic_products
      FROM "CanonicalRecipeIngredients" ci
      LEFT JOIN "IngredientCategorized" f ON f."canonicalTag" = ci.name
      GROUP BY ci.id, ci.name
      ORDER BY real_products ASC, total_products DESC
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`📊 Found ${canonicals.length} canonical ingredients\n`);
    
    // Categorize by coverage
    const noRealProducts = canonicals.filter(c => c.real_products == 0);
    const someRealProducts = canonicals.filter(c => c.real_products > 0 && c.real_products < 5);
    const goodRealProducts = canonicals.filter(c => c.real_products >= 5);
    
    console.log('📈 COVERAGE BREAKDOWN:');
    console.log(`   ❌ No real products: ${noRealProducts.length} canonicals`);
    console.log(`   ⚠️  Limited real products (1-4): ${someRealProducts.length} canonicals`);
    console.log(`   ✅ Good real products (5+): ${goodRealProducts.length} canonicals`);
    
    // Show top priorities (no real products, high frequency)
    console.log('\n🎯 TOP PRIORITIES (No Real Products):');
    noRealProducts.slice(0, 20).forEach((canonical, index) => {
      console.log(`   ${index + 1}. ${canonical.name} (${canonical.total_products} total products)`);
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
    
    // Save detailed results
    const results = {
      totalCanonicals,
      canonicalsWithRealProducts,
      coveragePercentage,
      noRealProducts: noRealProducts.map(c => ({ name: c.name, totalProducts: c.total_products })),
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
    fs.writeFileSync('real_product_analysis.json', JSON.stringify(results, null, 2));
    console.log('\n💾 Detailed analysis saved to real_product_analysis.json');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    process.exit(0);
  }
}

analyzeRealProductCoverage(); 