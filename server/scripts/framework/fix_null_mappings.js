const { IngredientToCanonical, sequelize } = require('./db/models');

async function fixNullMappings() {
  console.log('🔧 FIXING NULL MAPPINGS...\n');
  
  try {
    // 1. Check how many null mappings exist
    const nullMappings = await IngredientToCanonical.count({
      where: {
        IngredientId: null
      }
    });
    
    console.log(`📊 Found ${nullMappings} mappings with null canonicalIngredientId`);
    
    if (nullMappings === 0) {
      console.log('✅ No null mappings found - database is clean!');
      process.exit(0);
    }
    
    // 2. Delete null mappings
    const deletedCount = await IngredientToCanonical.destroy({
      where: {
        IngredientId: null
      }
    });
    
    console.log(`🗑️  Deleted ${deletedCount} null mappings`);
    
    // 3. Verify cleanup
    const remainingNulls = await IngredientToCanonical.count({
      where: {
        IngredientId: null
      }
    });
    
    console.log(`✅ Remaining null mappings: ${remainingNulls}`);
    
    if (remainingNulls === 0) {
      console.log('🎉 All null mappings cleaned up successfully!');
      console.log('✅ Database is now ready for NOT NULL constraint');
    } else {
      console.log('⚠️  Some null mappings still exist - manual review needed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing null mappings:', error);
    process.exit(1);
  }
}

fixNullMappings(); 