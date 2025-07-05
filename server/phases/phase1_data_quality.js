const { Sequelize } = require('sequelize');
const db = require('./db/database');
const { Food, CanonicalIngredient } = require('./db/models');

async function phase1DataQuality() {
  console.log('🔧 PHASE 1: DATA QUALITY ASSESSMENT & CLEANUP\n');
  
  try {
    // 1. Identify untagged real products
    console.log('1️⃣ IDENTIFYING UNTAGGED REAL PRODUCTS');
    const untaggedRealProducts = await db.query(`
      SELECT COUNT(*) as count
      FROM "Food"
      WHERE "brandOwner" != 'Generic' 
        AND "canonicalTag" IS NULL
        AND "description" IS NOT NULL
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`   ❓ Untagged Real Products: ${untaggedRealProducts[0].count.toLocaleString()}`);
    
    if (untaggedRealProducts[0].count > 0) {
      console.log('   📋 Action: Map these to appropriate canonicals');
    }

    // 2. Find canonicals with only generic products
    console.log('\n2️⃣ IDENTIFYING GENERIC-ONLY CANONICALS');
    const genericOnlyCanonicals = await db.query(`
      SELECT ci.name, COUNT(f.id) as product_count
      FROM "CanonicalIngredients" ci
      LEFT JOIN "Food" f ON ci.name = f."canonicalTag"
      GROUP BY ci.id, ci.name
      HAVING COUNT(CASE WHEN f."brandOwner" != 'Generic' THEN 1 END) = 0
        AND COUNT(f.id) > 0
      ORDER BY product_count DESC
      LIMIT 20
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('   🟡 Canonicals with ONLY Generic Products:');
    genericOnlyCanonicals.forEach((canonical, index) => {
      console.log(`   ${index + 1}. ${canonical.name} (${canonical.product_count} products)`);
    });

    // 3. Find potential real products for generic-only canonicals
    console.log('\n3️⃣ FINDING REAL PRODUCTS FOR GENERIC-ONLY CANONICALS');
    for (const canonical of genericOnlyCanonicals.slice(0, 5)) { // Test first 5
      const potentialProducts = await db.query(`
        SELECT id, description, "brandOwner", "brandName"
        FROM "Food"
        WHERE "brandOwner" != 'Generic'
          AND "canonicalTag" IS NULL
          AND LOWER("description") LIKE :pattern
        LIMIT 5
      `, {
        replacements: { pattern: `%${canonical.name.toLowerCase()}%` },
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (potentialProducts.length > 0) {
        console.log(`   ✅ ${canonical.name}: Found ${potentialProducts.length} potential real products`);
        potentialProducts.forEach(product => {
          console.log(`      - ${product.brandName || product.brandOwner}: ${product.description.substring(0, 60)}...`);
        });
      } else {
        console.log(`   ⚠️  ${canonical.name}: No potential real products found`);
      }
    }

    // 4. Identify overly long canonical names
    console.log('\n4️⃣ IDENTIFYING OVERLY LONG CANONICAL NAMES');
    const longCanonicals = await db.query(`
      SELECT name, LENGTH(name) as length
      FROM "CanonicalIngredients"
      WHERE LENGTH(name) > 50
      ORDER BY LENGTH(name) DESC
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('   📏 Overly Long Canonical Names:');
    longCanonicals.forEach((canonical, index) => {
      console.log(`   ${index + 1}. "${canonical.name}" (${canonical.length} chars)`);
    });

    // 5. Summary and Action Plan
    console.log('\n5️⃣ PHASE 1 ACTION PLAN');
    console.log('   📋 Immediate Actions:');
    console.log(`      - Map ${untaggedRealProducts[0].count.toLocaleString()} untagged real products`);
    console.log(`      - Find real products for ${genericOnlyCanonicals.length} generic-only canonicals`);
    console.log(`      - Clean up ${longCanonicals.length} overly long canonical names`);
    
    console.log('\n   📋 Success Metrics:');
    console.log('      - Reduce untagged real products to <1%');
    console.log('      - Increase real product coverage to >50%');
    console.log('      - Clean up overly long canonical names');

  } catch (error) {
    console.error('❌ Phase 1 failed:', error);
  } finally {
    process.exit(0);
  }
}

phase1DataQuality(); 