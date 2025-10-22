require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function verifyPhase2() {
  console.log('🔍 Verifying Phase 2 Migration');
  console.log('==========================================\n');
  
  try {
    // Check migration status
    console.log('Checking migration status...');
    const { data: statusData, error: statusError } = await supabase
      .from('migration_status')
      .select('*')
      .eq('phase', 'Phase 2')
      .order('started_at', { ascending: false })
      .limit(1);
    
    if (statusError) {
      console.log('❌ Could not read migration_status');
      console.log('   Error:', statusError.message);
    } else if (statusData && statusData.length > 0) {
      const status = statusData[0];
      const statusIcon = status.status === 'completed' ? '✅' : '⏳';
      console.log(`${statusIcon} Phase 2 Status: ${status.status}`);
      console.log(`   Records processed: ${status.records_processed} / ${status.total_records}`);
      if (status.completed_at) {
        console.log(`   Completed: ${new Date(status.completed_at).toLocaleString()}`);
      }
      console.log('');
    }
    
    // Check record counts
    console.log('==========================================');
    console.log('Checking record counts...\n');
    
    const { count: oldCount, error: oldError } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true });
    
    const { count: newCount, error: newError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (oldError || newError) {
      console.log('❌ Error checking counts');
    } else {
      console.log(`Old table (IngredientCategorized): ${oldCount.toLocaleString()} records`);
      console.log(`New table (products): ${newCount.toLocaleString()} records`);
      
      if (oldCount === newCount) {
        console.log('✅ PASS: Record counts match!\n');
      } else {
        console.log(`❌ FAIL: Difference of ${Math.abs(oldCount - newCount)} records\n`);
      }
    }
    
    // Check data quality
    console.log('==========================================');
    console.log('Checking data quality...\n');
    
    const { data: sampleProducts, error: sampleError } = await supabase
      .from('products')
      .select('id, name, brand_name, category_id, subcategory_id, allergens, is_processed, is_fresh_produce')
      .limit(5);
    
    if (sampleError) {
      console.log('❌ Could not fetch sample products');
    } else if (sampleProducts && sampleProducts.length > 0) {
      console.log('Sample migrated products:');
      sampleProducts.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Brand: ${p.brand_name || 'N/A'}`);
        console.log(`   Category ID: ${p.category_id || 'NULL'}`);
        console.log(`   Subcategory ID: ${p.subcategory_id || 'NULL'}`);
        console.log(`   Allergens: ${p.allergens ? p.allergens.length : 0}`);
        console.log(`   Is Processed: ${p.is_processed}`);
        console.log(`   Is Fresh Produce: ${p.is_fresh_produce}`);
      });
      console.log('');
    }
    
    // Check categorization
    console.log('==========================================');
    console.log('Checking categorization...\n');
    
    const { count: withCategory } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('category_id', 'is', null);
    
    const { count: withSubcategory } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .not('subcategory_id', 'is', null);
    
    const { count: processed } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_processed', true);
    
    const { count: freshProduce } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_fresh_produce', true);
    
    console.log(`Products with category_id: ${(withCategory || 0).toLocaleString()}`);
    console.log(`Products with subcategory_id: ${(withSubcategory || 0).toLocaleString()}`);
    console.log(`Processed products: ${(processed || 0).toLocaleString()}`);
    console.log(`Fresh produce products: ${(freshProduce || 0).toLocaleString()}`);
    console.log('');
    
    // Check old table still works
    console.log('==========================================');
    console.log('Checking old table...\n');
    
    const { count: oldTableCount, error: oldTableError } = await supabase
      .from('IngredientCategorized')
      .select('*', { count: 'exact', head: true });
    
    if (oldTableError) {
      console.log('❌ Old IngredientCategorized table: ERROR');
      console.log('   This is bad - your website may not work!');
    } else {
      console.log(`✅ Old IngredientCategorized table: STILL EXISTS (${oldTableCount.toLocaleString()} records)`);
      console.log('   Website should still be working!\n');
    }
    
    console.log('==========================================');
    console.log('VERIFICATION SUMMARY:\n');
    
    console.log('Phase 2 is complete if you see:');
    console.log('  ✅ Record counts match between old and new tables');
    console.log('  ✅ Sample products have proper data');
    console.log('  ✅ Category mappings are populated');
    console.log('  ✅ Old IngredientCategorized table still exists');
    console.log('  ✅ Website is still working\n');
    
    console.log('Next Steps:');
    console.log('  📋 Phase 3: Build ingredient taxonomy (Week 3)');
    console.log('  📋 Run: scripts/import_usda_taxonomy.js (optional)');
    console.log('  📋 Then: database/migrations/phase3_build_taxonomy.sql\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyPhase2();

