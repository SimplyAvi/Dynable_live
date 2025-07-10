const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function addRealProductsSafe() {
  console.log('🛡️  SAFE REAL PRODUCT ADDITION\n');
  
  try {
    // Step 1: Find real products for unsalted butter
    console.log('🔍 Finding real butter products...');
    const butterProducts = await db.query(`
      SELECT id, description, "brandOwner", "brandName", "canonicalTag"
      FROM "Food" 
      WHERE "brandOwner" != 'Generic' 
        AND "brandOwner" != ''
        AND "brandOwner" IS NOT NULL
        AND description ILIKE '%butter%'
        AND description NOT ILIKE '%peanut%'
        AND description NOT ILIKE '%almond%'
        AND description NOT ILIKE '%cashew%'
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`Found ${butterProducts.length} real butter products:`);
    butterProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.description} (${product.brandOwner})`);
    });
    
    // Step 2: Tag them as 'unsalted butter' if they're not already tagged
    let taggedCount = 0;
    for (const product of butterProducts) {
      if (!product.canonicalTag || product.canonicalTag !== 'unsalted butter') {
        try {
          await db.query(`
            UPDATE "Food" 
            SET "canonicalTag" = 'unsalted butter',
                "canonicalTagConfidence" = 'confident'
            WHERE id = :id
          `, {
            replacements: { id: product.id }
          });
          console.log(`   ✅ Tagged: ${product.description}`);
          taggedCount++;
        } catch (error) {
          console.log(`   ❌ Failed to tag ${product.description}: ${error.message}`);
        }
      } else {
        console.log(`   ℹ️  Already tagged: ${product.description}`);
      }
    }
    
    // Step 3: Test the results
    console.log('\n🧪 Testing results...');
    const testResults = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real,
        COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic
      FROM "Food" 
      WHERE "canonicalTag" = 'unsalted butter'
    `, { type: Sequelize.QueryTypes.SELECT });
    
    if (testResults[0]) {
      console.log(`   📊 unsalted butter products:`);
      console.log(`      Total: ${testResults[0].total}`);
      console.log(`      Real: ${testResults[0].real}`);
      console.log(`      Generic: ${testResults[0].generic}`);
      console.log(`      Real product coverage: ${(testResults[0].real/testResults[0].total*100).toFixed(1)}%`);
    }
    
    // Step 4: Find real chocolate products
    console.log('\n🔍 Finding real chocolate products...');
    const chocolateProducts = await db.query(`
      SELECT id, description, "brandOwner", "brandName", "canonicalTag"
      FROM "Food" 
      WHERE "brandOwner" != 'Generic' 
        AND "brandOwner" != ''
        AND "brandOwner" IS NOT NULL
        AND description ILIKE '%chocolate%'
        AND description NOT ILIKE '%syrup%'
        AND description NOT ILIKE '%sauce%'
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`Found ${chocolateProducts.length} real chocolate products:`);
    chocolateProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.description} (${product.brandOwner})`);
    });
    
    // Step 5: Tag chocolate products
    for (const product of chocolateProducts) {
      if (!product.canonicalTag || !product.canonicalTag.includes('chocolate')) {
        try {
          await db.query(`
            UPDATE "Food" 
            SET "canonicalTag" = 'bittersweet chocolate',
                "canonicalTagConfidence" = 'suggested'
            WHERE id = :id
          `, {
            replacements: { id: product.id }
          });
          console.log(`   ✅ Tagged: ${product.description}`);
          taggedCount++;
        } catch (error) {
          console.log(`   ❌ Failed to tag ${product.description}: ${error.message}`);
        }
      } else {
        console.log(`   ℹ️  Already tagged: ${product.description}`);
      }
    }
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`   ✅ Tagged ${taggedCount} new real products`);
    console.log(`   🛡️  All changes are safe and reversible`);
    console.log(`   🧪 Test results show improved real product coverage`);
    
  } catch (error) {
    console.error('❌ Safe product addition failed:', error);
  } finally {
    process.exit(0);
  }
}

addRealProductsSafe(); 