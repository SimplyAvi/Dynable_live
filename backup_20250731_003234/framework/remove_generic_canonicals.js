const db = require('./db/database');

async function removeGenericCanonicals() {
  console.log('🗑️ REMOVING GENERIC CANONICAL INGREDIENTS\n');
  
  try {
    await db.authenticate();
    console.log('✅ Database connected\n');
    
    // The 28 definitely remove canonicals identified in the analysis
    const genericCanonicals = [
      'slices', 'cup', 'cups', 'cloves', 'slice', 'sprigs', 'sticks', 'threads', 
      'shavings', 'shells', 'wedges', 'wheels', 'servings', 'toppings', 'vegetables', 
      'powder', 'seeds', 'spice', 'stock', 'solution', 'soda', 'salad', 'tortillas', 
      'twist', 'wrap', 'recipe', 'stick', 'spray', 'wedge', 'wheel', 'thread', 
      'shaving', 'shell', 'serving', 'topping', 'vegetable', 'grated'
    ];
    
    console.log(`📋 Found ${genericCanonicals.length} generic canonicals to remove\n`);
    
    let totalRemoved = 0;
    let totalMappingsRemoved = 0;
    let log = [];
    
    for (const canonicalName of genericCanonicals) {
      try {
        // Find the canonical ingredient
        const canonical = await db.query(`
          SELECT id, name FROM "CanonicalRecipeIngredients" 
          WHERE name ILIKE :canonicalName
        `, { 
          replacements: { canonicalName },
          type: db.QueryTypes.SELECT 
        });
        
        if (canonical.length === 0) {
          console.log(`  ⚠️  Canonical not found: ${canonicalName}`);
          continue;
        }
        
        const canonicalId = canonical[0].id;
        const actualName = canonical[0].name;
        
        // Count mappings for this canonical
        const mappingCount = await db.query(`
          SELECT COUNT(*) as count FROM "IngredientToCanonicals" 
          WHERE "IngredientId" = :canonicalId
        `, { 
          replacements: { canonicalId },
          type: db.QueryTypes.SELECT 
        });
        
        const count = mappingCount[0].count;
        
        // Remove all mappings for this canonical
        await db.query(`
          DELETE FROM "IngredientToCanonicals" 
          WHERE "IngredientId" = :canonicalId
        `, { 
          replacements: { canonicalId },
          type: db.QueryTypes.DELETE 
        });
        
        // Remove the canonical ingredient itself
        await db.query(`
          DELETE FROM "CanonicalRecipeIngredients" 
          WHERE id = :canonicalId
        `, { 
          replacements: { canonicalId },
          type: db.QueryTypes.DELETE 
        });
        
        totalRemoved++;
        totalMappingsRemoved += count;
        
        console.log(`  ✅ Removed "${actualName}": ${count} mappings`);
        log.push(`Removed "${actualName}": ${count} mappings`);
        
      } catch (error) {
        console.log(`  ❌ Error removing ${canonicalName}: ${error.message}`);
        log.push(`Error removing ${canonicalName}: ${error.message}`);
      }
    }
    
    // Write log to file
    const fs = require('fs');
    fs.writeFileSync('remove_generic_canonicals.log', log.join('\n'));
    
    console.log(`\n📊 CLEANUP COMPLETE:`);
    console.log(`   Canonicals removed: ${totalRemoved}`);
    console.log(`   Total mappings removed: ${totalMappingsRemoved}`);
    console.log(`   Log written to: remove_generic_canonicals.log`);
    
    // Verify cleanup
    console.log(`\n🔍 VERIFICATION:`);
    const remainingGeneric = await db.query(`
      SELECT ci.name, COUNT(itc.id) as mapping_count
      FROM "CanonicalRecipeIngredients" ci
      JOIN "IngredientToCanonicals" itc ON ci.id = itc."IngredientId"
      WHERE ci.name ILIKE ANY(ARRAY[:genericNames])
      GROUP BY ci.id, ci.name
      ORDER BY mapping_count DESC
    `, { 
      replacements: { genericNames: genericCanonicals },
      type: db.QueryTypes.SELECT 
    });
    
    if (remainingGeneric.length === 0) {
      console.log(`   ✅ All generic canonicals successfully removed`);
    } else {
      console.log(`   ⚠️  ${remainingGeneric.length} generic canonicals still remain:`);
      remainingGeneric.forEach(item => {
        console.log(`      "${item.name}": ${item.mapping_count} mappings`);
      });
    }
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await db.close();
  }
}

removeGenericCanonicals(); 