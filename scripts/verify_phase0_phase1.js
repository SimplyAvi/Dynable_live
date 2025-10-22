require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function verifyMigration() {
  console.log('🔍 Verifying Phase 0 & Phase 1 Migration');
  console.log('==========================================\n');
  
  try {
    // Check if new tables exist
    console.log('Checking new tables...');
    
    const tables = ['products', 'ingredients', 'ingredient_product_mapping', 'mapping_review_queue', 'ingredient_history', 'migration_status'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Table "${table}": NOT FOUND`);
          console.log(`   Error: ${error.message}`);
        } else {
          console.log(`✅ Table "${table}": EXISTS (${count || 0} records)`);
        }
      } catch (err) {
        console.log(`❌ Table "${table}": ERROR - ${err.message}`);
      }
    }
    
    console.log('\n==========================================');
    console.log('Checking migration status...\n');
    
    const { data: statusData, error: statusError } = await supabase
      .from('migration_status')
      .select('*')
      .order('completed_at', { ascending: false });
    
    if (statusError) {
      console.log('❌ Could not read migration_status table');
      console.log('   This likely means the migration has not been run yet\n');
    } else if (statusData && statusData.length > 0) {
      console.log('Migration Status Log:');
      statusData.forEach(log => {
        const status = log.status === 'completed' ? '✅' : '⏳';
        console.log(`${status} ${log.phase} - ${log.step}: ${log.status}`);
        if (log.completed_at) {
          console.log(`   Completed: ${new Date(log.completed_at).toLocaleString()}`);
        }
      });
      console.log('');
    }
    
    console.log('==========================================');
    console.log('Checking old tables (should still exist)...\n');
    
    const { count: oldCount, error: oldError } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true });
    
    if (oldError) {
      console.log('❌ Old IngredientCategorized table: ERROR');
      console.log('   This is bad - your website may not work!');
    } else {
      console.log(`✅ Old IngredientCategorized table: STILL EXISTS (${oldCount} records)`);
      console.log('   Website should still be working!\n');
    }
    
    console.log('==========================================');
    console.log('VERIFICATION SUMMARY:\n');
    
    console.log('Phase 0 & 1 is complete if you see:');
    console.log('  ✅ All new tables exist with 0 records');
    console.log('  ✅ migration_status shows "completed"');
    console.log('  ✅ Old IngredientCategorized table still exists');
    console.log('  ✅ Website is still working\n');
    
    console.log('Next Steps:');
    console.log('  📋 Phase 2: Migrate product data (Week 2)');
    console.log('  📋 Phase 3: Build ingredient taxonomy (Week 3)\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\nThis likely means the migration has not been run yet.');
    console.log('Please execute: database/migrations/phase0_phase1_backup_and_new_schema.sql\n');
  }
}

verifyMigration();

