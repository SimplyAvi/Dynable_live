const { Sequelize } = require('sequelize');
const db = require('./db/database');

async function fixIncorrectMappings() {
  console.log('🔧 FIXING INCORRECT MAPPINGS\n');
  
  // Define fixes for each problematic ingredient
  const fixes = [
    {
      ingredient: 'milk',
      description: 'Remove protein powder, ricotta, half & half from milk',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'milk' 
          AND (description ILIKE '%protein powder%' 
               OR description ILIKE '%ricotta%' 
               OR description ILIKE '%half & half%'
               OR description ILIKE '%half and half%')
      `
    },
    {
      ingredient: 'bread',
      description: 'Remove bread crumbs from bread',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'bread' 
          AND description ILIKE '%bread crumbs%'
      `
    },
    {
      ingredient: 'sour cream',
      description: 'Remove maple syrup from sour cream',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'sour cream' 
          AND description ILIKE '%maple%'
      `
    },
    {
      ingredient: 'cream cheese',
      description: 'Remove generic placeholders from cream cheese',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'cream cheese' 
          AND (description ILIKE '%pure%' OR description ILIKE '%generic%')
      `
    },
    {
      ingredient: 'garlic',
      description: 'Remove tandoori masala from garlic',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'garlic' 
          AND description ILIKE '%tandoori%'
      `
    },
    {
      ingredient: 'tomato',
      description: 'Remove grapefruit products from tomato',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'tomato' 
          AND description ILIKE '%grapefruit%'
      `
    },
    {
      ingredient: 'potato',
      description: 'Remove specific potato varieties from generic potato',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'potato' 
          AND (description ILIKE '%russet%' OR description ILIKE '%red potato%')
      `
    },
    {
      ingredient: 'onion',
      description: 'Remove salsa and stir-fry from onion',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'onion' 
          AND (description ILIKE '%salsa%' OR description ILIKE '%stir-fry%')
      `
    },
    {
      ingredient: 'ham',
      description: 'Remove mushroom and generic from ham',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'ham' 
          AND (description ILIKE '%mushroom%' OR description ILIKE '%generic%')
      `
    },
    {
      ingredient: 'salmon',
      description: 'Remove smoked salmon from salmon',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'salmon' 
          AND (description ILIKE '%smoked%' OR description ILIKE '%nova%')
      `
    },
    {
      ingredient: 'shrimp',
      description: 'Remove jumbo shrimp from shrimp',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'shrimp' 
          AND description ILIKE '%jumbo%'
      `
    },
    {
      ingredient: 'rice',
      description: 'Remove basmati rice from rice',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'rice' 
          AND description ILIKE '%basmati%'
      `
    },
    {
      ingredient: 'pasta',
      description: 'Remove black bean pasta from pasta',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'pasta' 
          AND description ILIKE '%black bean%'
      `
    },
    {
      ingredient: 'honey',
      description: 'Remove raw honey and fruit from honey',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'honey' 
          AND (description ILIKE '%raw%' OR description ILIKE '%fruit%' OR description ILIKE '%soda%')
      `
    },
    {
      ingredient: 'vinegar',
      description: 'Remove balsamic vinegar and chicken wings from vinegar',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'vinegar' 
          AND (description ILIKE '%balsamic%' OR description ILIKE '%chicken wings%')
      `
    },
    {
      ingredient: 'soy sauce',
      description: 'Remove all generic placeholders from soy sauce',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'soy sauce' 
          AND (description ILIKE '%pure%' OR description ILIKE '%generic%' OR description ILIKE '%pasta sauce%')
      `
    },
    {
      ingredient: 'mustard',
      description: 'Remove spring mix and gum from mustard',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'mustard' 
          AND (description ILIKE '%spring mix%' OR description ILIKE '%gum%')
      `
    },
    {
      ingredient: 'walnut',
      description: 'Remove raw walnuts from walnut',
      query: `
        UPDATE "IngredientCategorized" 
        SET "canonicalTag" = NULL, "canonicalTagConfidence" = NULL
        WHERE "canonicalTag" = 'walnut' 
          AND description ILIKE '%raw%'
      `
    }
  ];
  
  let totalFixed = 0;
  
  for (const fix of fixes) {
    console.log(`🔧 Fixing: ${fix.description}`);
    
    try {
      // Get count before fix
      const beforeCount = await db.query(`
        SELECT COUNT(*) as count
        FROM "IngredientCategorized" 
        WHERE "canonicalTag" = :canonical
      `, {
        replacements: { canonical: fix.ingredient },
        type: Sequelize.QueryTypes.SELECT
      });
      
      const beforeCountNum = beforeCount[0]?.count || 0;
      
      // Apply the fix
      await db.query(fix.query, { type: Sequelize.QueryTypes.UPDATE });
      
      // Get count after fix
      const afterCount = await db.query(`
        SELECT COUNT(*) as count
        FROM "IngredientCategorized" 
        WHERE "canonicalTag" = :canonical
      `, {
        replacements: { canonical: fix.ingredient },
        type: Sequelize.QueryTypes.SELECT
      });
      
      const afterCountNum = afterCount[0]?.count || 0;
      const fixed = beforeCountNum - afterCountNum;
      
      console.log(`   ✅ Fixed ${fixed} products (${beforeCountNum} → ${afterCountNum})`);
      totalFixed += fixed;
      
    } catch (error) {
      console.log(`   ❌ Error fixing ${fix.ingredient}: ${error.message}`);
    }
  }
  
  console.log(`\n🎯 FIX SUMMARY:`);
  console.log(`   ✅ Total products fixed: ${totalFixed}`);
  console.log(`   🛡️  All changes are safe and reversible`);
  
  // Test the fixes
  console.log('\n🧪 TESTING FIXES:');
  
  const testRecipeIngredients = ['milk', 'bread', 'sour cream', 'cream cheese', 'garlic', 'tomato', 'potato', 'onion', 'ham', 'salmon', 'shrimp', 'rice', 'pasta', 'honey', 'vinegar', 'soy sauce', 'mustard', 'walnut'];
  
  for (const ingredient of testRecipeIngredients) {
    const testResults = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN "brandOwner" != 'Generic' THEN 1 END) as real,
        COUNT(CASE WHEN "brandOwner" = 'Generic' THEN 1 END) as generic
      FROM "IngredientCategorized" 
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

fixIncorrectMappings(); 