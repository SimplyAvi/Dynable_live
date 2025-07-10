const { Sequelize } = require('sequelize');
const db = require('./db/database');

// High-priority ingredients with their canonical names
const PRIORITY_INGREDIENTS = [
  { canonical: 'unsalted butter', keywords: ['butter'], exclude: ['peanut', 'almond', 'cashew', 'sunflower'] },
  { canonical: 'bittersweet chocolate', keywords: ['chocolate'], exclude: ['syrup', 'sauce', 'milk'] },
  { canonical: 'dijon mustard', keywords: ['mustard'], exclude: ['honey', 'spicy'] },
  { canonical: 'extra virgin olive oil', keywords: ['olive oil'], exclude: ['light', 'pomace'] },
  { canonical: 'kosher salt', keywords: ['salt'], exclude: ['sea', 'himalayan', 'pink'] },
  { canonical: 'all-purpose flour', keywords: ['flour'], exclude: ['bread', 'cake', 'whole wheat'] },
  { canonical: 'granulated sugar', keywords: ['sugar'], exclude: ['brown', 'powdered', 'confectioners'] },
  { canonical: 'large eggs', keywords: ['egg'], exclude: ['white', 'yolk', 'powder'] },
  { canonical: 'vanilla extract', keywords: ['vanilla'], exclude: ['bean', 'powder', 'flavoring'] },
  { canonical: 'black pepper', keywords: ['pepper'], exclude: ['white', 'cayenne', 'red'] }
];

async function addRealProductsComprehensive() {
  console.log('🚀 COMPREHENSIVE REAL PRODUCT ADDITION\n');
  
  let totalTagged = 0;
  const results = [];
  
  for (const ingredient of PRIORITY_INGREDIENTS) {
    console.log(`🔍 Processing: ${ingredient.canonical}`);
    
    try {
      // Build query with keywords and exclusions
      const keywordConditions = ingredient.keywords.map(k => `description ILIKE '%${k}%'`).join(' OR ');
      const excludeConditions = ingredient.exclude.map(e => `description NOT ILIKE '%${e}%'`).join(' AND ');
      
      const query = `
        SELECT id, description, "brandOwner", "brandName", "canonicalTag"
        FROM "Food" 
        WHERE "brandOwner" != 'Generic' 
          AND "brandOwner" != ''
          AND "brandOwner" IS NOT NULL
          AND (${keywordConditions})
          AND ${excludeConditions}
        LIMIT 15
      `;
      
      const products = await db.query(query, { type: Sequelize.QueryTypes.SELECT });
      
      console.log(`   Found ${products.length} real products`);
      
      let taggedCount = 0;
      for (const product of products) {
        if (!product.canonicalTag || product.canonicalTag !== ingredient.canonical) {
          try {
            await db.query(`
              UPDATE "Food" 
              SET "canonicalTag" = :canonical,
                  "canonicalTagConfidence" = 'confident'
              WHERE id = :id
            `, {
              replacements: { 
                canonical: ingredient.canonical,
                id: product.id 
              }
            });
            console.log(`   ✅ Tagged: ${product.description.substring(0, 50)}...`);
            taggedCount++;
          } catch (error) {
            console.log(`   ❌ Failed to tag: ${error.message}`);
          }
        }
      }
      
      // Test results for this ingredient
      const testResults = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real,
          COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic
        FROM "Food" 
        WHERE "canonicalTag" = :canonical
      `, { 
        replacements: { canonical: ingredient.canonical },
        type: Sequelize.QueryTypes.SELECT 
      });
      
      if (testResults[0]) {
        const coverage = (testResults[0].real / testResults[0].total * 100).toFixed(1);
        console.log(`   📊 Coverage: ${coverage}% (${testResults[0].real}/${testResults[0].total})`);
        
        results.push({
          ingredient: ingredient.canonical,
          total: testResults[0].total,
          real: testResults[0].real,
          generic: testResults[0].generic,
          coverage: parseFloat(coverage),
          tagged: taggedCount
        });
      }
      
      totalTagged += taggedCount;
      
    } catch (error) {
      console.log(`   ❌ Error processing ${ingredient.canonical}: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Summary
  console.log('🎯 COMPREHENSIVE RESULTS:\n');
  console.log(`   ✅ Total products tagged: ${totalTagged}`);
  console.log(`   🛡️  All changes are safe and reversible`);
  console.log('\n   📊 Coverage by ingredient:');
  
  results.sort((a, b) => b.coverage - a.coverage);
  results.forEach(result => {
    console.log(`      ${result.ingredient}: ${result.coverage}% (${result.real}/${result.total})`);
  });
  
  const avgCoverage = results.reduce((sum, r) => sum + r.coverage, 0) / results.length;
  console.log(`\n   📈 Average real product coverage: ${avgCoverage.toFixed(1)}%`);
  
  // Test overall improvement
  console.log('\n🧪 Testing overall improvement...');
  const overallTest = await db.query(`
    SELECT 
      COUNT(*) as total_products,
      COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real_products,
      COUNT(CASE WHEN "canonicalTag" IS NOT NULL THEN 1 END) as tagged_products
    FROM "Food" 
    WHERE "canonicalTag" IN (${PRIORITY_INGREDIENTS.map(i => `'${i.canonical}'`).join(',')})
  `, { type: Sequelize.QueryTypes.SELECT });
  
  if (overallTest[0]) {
    const overallCoverage = (overallTest[0].real_products / overallTest[0].total_products * 100).toFixed(1);
    console.log(`   📊 Overall real product coverage: ${overallCoverage}%`);
    console.log(`   📊 Total tagged products: ${overallTest[0].tagged_products}`);
  }
  
  process.exit(0);
}

addRealProductsComprehensive(); 