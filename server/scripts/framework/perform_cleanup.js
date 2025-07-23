const db = require('./db/database.js');

async function performCleanup() {
  try {
    await db.authenticate();
    const IngredientToCanonical = require('./db/models/IngredientToCanonical.js');
    
    console.log('🧹 Performing cleanup of overly long mappings...\n');
    
    // Count before cleanup
    const beforeCount = await IngredientToCanonical.count();
    console.log(`📊 Mappings before cleanup: ${beforeCount.toLocaleString()}`);
    
    // Find overly long mappings
    const longMappings = await IngredientToCanonical.findAll({
      where: db.Sequelize.literal('LENGTH("messyName") > 100'),
      attributes: ['id', 'messyName']
    });
    
    console.log(`🔍 Found ${longMappings.length.toLocaleString()} overly long mappings to remove`);
    
    if (longMappings.length === 0) {
      console.log('✅ No cleanup needed!');
      return;
    }
    
    // Show sample of what will be removed
    console.log('\n📝 Sample mappings to be removed:');
    longMappings.slice(0, 5).forEach(mapping => {
      console.log(`  - "${mapping.messyName.substring(0, 80)}..." (${mapping.messyName.length} chars)`);
    });
    
    // Perform the cleanup
    console.log('\n🗑️  Removing overly long mappings...');
    const deletedCount = await IngredientToCanonical.destroy({
      where: db.Sequelize.literal('LENGTH("messyName") > 100')
    });
    
    // Count after cleanup
    const afterCount = await IngredientToCanonical.count();
    
    console.log('\n✅ Cleanup complete!');
    console.log(`  Removed: ${deletedCount.toLocaleString()} mappings`);
    console.log(`  Remaining: ${afterCount.toLocaleString()} mappings`);
    console.log(`  Reduction: ${((deletedCount / beforeCount) * 100).toFixed(1)}%`);
    
    // Verify no overly long mappings remain
    const remainingLong = await IngredientToCanonical.count({
      where: db.Sequelize.literal('LENGTH("messyName") > 100')
    });
    console.log(`  Overly long mappings remaining: ${remainingLong}`);
    
    if (remainingLong === 0) {
      console.log('🎉 All overly long mappings successfully removed!');
    } else {
      console.log('⚠️  Some overly long mappings still remain.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

performCleanup(); 