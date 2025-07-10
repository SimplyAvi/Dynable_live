const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function investigateHighCounts() {
  console.log('🔍 INVESTIGATING SUSPICIOUS HIGH COUNTS\n');
  
  const suspiciousIngredients = [
    'milk', 'bread', 'yogurt', 'butter', 'cheddar cheese', 'almond', 'peanut'
  ];
  
  for (const ingredient of suspiciousIngredients) {
    console.log(`\n🔍 Investigating: ${ingredient}`);
    
    // Get all products tagged with this ingredient
    const products = await db.query(`
      SELECT id, description, "brandOwner", "brandName", "canonicalTag"
      FROM "Food" 
      WHERE "canonicalTag" = :canonical
      ORDER BY id
      LIMIT 10
    `, {
      replacements: { canonical: ingredient },
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log(`   📊 Total products tagged: ${products.length > 0 ? 'Many' : 'None'}`);
    console.log(`   🔍 Sample products:`);
    
    products.forEach((product, index) => {
      console.log(`      ${index + 1}. ${product.description.substring(0, 80)}...`);
      console.log(`         Brand: ${product.brandOwner}`);
    });
    
    // Get count breakdown
    const countBreakdown = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real,
        COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic
      FROM "Food" 
      WHERE "canonicalTag" = :canonical
    `, {
      replacements: { canonical: ingredient },
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (countBreakdown[0]) {
      console.log(`   📈 Breakdown:`);
      console.log(`      Total: ${countBreakdown[0].total}`);
      console.log(`      Real: ${countBreakdown[0].real}`);
      console.log(`      Generic: ${countBreakdown[0].generic}`);
      console.log(`      Coverage: ${(countBreakdown[0].real/countBreakdown[0].total*100).toFixed(1)}%`);
    }
  }
  
  // Check if there are any obviously wrong tags
  console.log('\n🚨 CHECKING FOR OBVIOUSLY WRONG TAGS:');
  
  const wrongTags = await db.query(`
    SELECT "canonicalTag", COUNT(*) as count
    FROM "Food" 
    WHERE "canonicalTag" IS NOT NULL
    GROUP BY "canonicalTag"
    ORDER BY count DESC
    LIMIT 10
  `, { type: Sequelize.QueryTypes.SELECT });
  
  console.log('   📊 Top tagged ingredients by count:');
  wrongTags.forEach((tag, index) => {
    console.log(`      ${index + 1}. ${tag.canonicalTag}: ${tag.count} products`);
  });
  
  // Check for products that might be incorrectly tagged
  console.log('\n🔍 CHECKING FOR POTENTIAL MISMATCHES:');
  
  const potentialMismatches = await db.query(`
    SELECT description, "brandOwner", "canonicalTag"
    FROM "Food" 
    WHERE "canonicalTag" IN ('milk', 'bread', 'yogurt', 'butter')
      AND description NOT ILIKE '%' || "canonicalTag" || '%'
    LIMIT 5
  `, { type: Sequelize.QueryTypes.SELECT });
  
  console.log('   🔍 Products that might be incorrectly tagged:');
  potentialMismatches.forEach((product, index) => {
    console.log(`      ${index + 1}. ${product.description.substring(0, 80)}...`);
    console.log(`         Tagged as: ${product.canonicalTag}`);
    console.log(`         Brand: ${product.brandOwner}`);
  });
  
  process.exit(0);
}

investigateHighCounts(); 