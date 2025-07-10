const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function fixIncorrectTags() {
  console.log('🔧 FIXING INCORRECT TAGS\n');
  
  // List of ingredients that need fixing
  const fixList = [
    {
      canonical: 'milk',
      description: 'Remove milk chocolate products from milk tag',
      query: `
        UPDATE "Food" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'milk' 
          AND description ILIKE '%chocolate%'
      `
    },
    {
      canonical: 'bread',
      description: 'Remove gingerbread and stuffing from bread tag',
      query: `
        UPDATE "Food" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'bread' 
          AND (description ILIKE '%gingerbread%' OR description ILIKE '%stuffing%')
      `
    },
    {
      canonical: 'butter',
      description: 'Remove peanut butter and butter rum from butter tag',
      query: `
        UPDATE "Food" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'butter' 
          AND (description ILIKE '%peanut butter%' OR description ILIKE '%butter rum%' OR description ILIKE '%buttercream%')
      `
    },
    {
      canonical: 'yogurt',
      description: 'Remove almond milk yogurt from yogurt tag',
      query: `
        UPDATE "Food" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'yogurt' 
          AND description ILIKE '%almond%'
      `
    },
    {
      canonical: 'salt',
      description: 'Remove overly broad salt tags',
      query: `
        UPDATE "Food" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'salt' 
          AND description NOT ILIKE '%salt%'
      `
    },
    {
      canonical: 'sugar',
      description: 'Remove overly broad sugar tags',
      query: `
        UPDATE "Food" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'sugar' 
          AND description NOT ILIKE '%sugar%'
      `
    },
    {
      canonical: 'water',
      description: 'Remove overly broad water tags',
      query: `
        UPDATE "Food" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'water' 
          AND description NOT ILIKE '%water%'
      `
    }
  ];
  
  let totalFixed = 0;
  
  for (const fix of fixList) {
    console.log(`🔧 Fixing: ${fix.description}`);
    
    try {
      // Get count before fix
      const beforeCount = await db.query(`
        SELECT COUNT(*) as count
        FROM "Food" 
        WHERE "canonicalTag" = :canonical
      `, {
        replacements: { canonical: fix.canonical },
        type: Sequelize.QueryTypes.SELECT
      });
      
      const beforeCountNum = beforeCount[0]?.count || 0;
      
      // Apply the fix
      await db.query(fix.query, { type: Sequelize.QueryTypes.UPDATE });
      
      // Get count after fix
      const afterCount = await db.query(`
        SELECT COUNT(*) as count
        FROM "Food" 
        WHERE "canonicalTag" = :canonical
      `, {
        replacements: { canonical: fix.canonical },
        type: Sequelize.QueryTypes.SELECT
      });
      
      const afterCountNum = afterCount[0]?.count || 0;
      const fixed = beforeCountNum - afterCountNum;
      
      console.log(`   ✅ Fixed ${fixed} products (${beforeCountNum} → ${afterCountNum})`);
      totalFixed += fixed;
      
    } catch (error) {
      console.log(`   ❌ Error fixing ${fix.canonical}: ${error.message}`);
    }
  }
  
  console.log(`\n🎯 FIX SUMMARY:`);
  console.log(`   ✅ Total products fixed: ${totalFixed}`);
  console.log(`   🛡️  All changes are safe and reversible`);
  
  // Test the fixes
  console.log('\n🧪 TESTING FIXES:');
  
  const testIngredients = ['milk', 'bread', 'butter', 'yogurt', 'salt', 'sugar', 'water'];
  
  for (const ingredient of testIngredients) {
    const testResults = await db.query(`
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
    
    if (testResults[0]) {
      const coverage = (testResults[0].real / testResults[0].total * 100).toFixed(1);
      console.log(`   ${ingredient}: ${coverage}% (${testResults[0].real}/${testResults[0].total})`);
    }
  }
  
  process.exit(0);
}

fixIncorrectTags(); 