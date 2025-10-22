require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function verifyPhase3() {
  console.log('🔍 Verifying Phase 3 Migration');
  console.log('==========================================\n');
  
  try {
    // Check migration status
    console.log('Checking migration status...');
    const { data: statusData, error: statusError } = await supabase
      .from('migration_status')
      .select('*')
      .eq('phase', 'Phase 3')
      .order('started_at', { ascending: false })
      .limit(1);
    
    if (statusError) {
      console.log('❌ Could not read migration_status');
    } else if (statusData && statusData.length > 0) {
      const status = statusData[0];
      const statusIcon = status.status === 'completed' ? '✅' : '⏳';
      console.log(`${statusIcon} Phase 3 Status: ${status.status}`);
      console.log(`   Ingredients created: ${status.records_processed || 'Unknown'}`);
      if (status.completed_at) {
        console.log(`   Completed: ${new Date(status.completed_at).toLocaleString()}`);
      }
      console.log('');
    }
    
    // Check total ingredient count
    console.log('==========================================');
    console.log('Checking ingredient taxonomy...\n');
    
    const { count: totalCount } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total ingredients: ${(totalCount || 0).toLocaleString()}`);
    console.log('');
    
    // Check by category
    console.log('==========================================');
    console.log('Ingredients by category:\n');
    
    const { data: categoryStats } = await supabase
      .from('ingredients')
      .select('category');
    
    if (categoryStats) {
      const categoryCounts = {};
      categoryStats.forEach(row => {
        categoryCounts[row.category] = (categoryCounts[row.category] || 0) + 1;
      });
      
      Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count.toLocaleString()}`);
        });
      console.log('');
    }
    
    // Show sample categorized ingredients
    console.log('==========================================');
    console.log('Sample categorized ingredients:\n');
    
    const { data: samples } = await supabase
      .from('ingredients')
      .select('canonical_name, category, subcategory, allergens, aliases')
      .neq('category', 'unknown')
      .limit(10);
    
    if (samples) {
      samples.forEach((ing, i) => {
        console.log(`${i + 1}. ${ing.canonical_name}`);
        console.log(`   Category: ${ing.category}${ing.subcategory ? ' → ' + ing.subcategory : ''}`);
        if (ing.allergens && ing.allergens.length > 0) {
          console.log(`   Allergens: ${ing.allergens.join(', ')}`);
        }
        if (ing.aliases && ing.aliases.length > 0) {
          console.log(`   Aliases: ${ing.aliases.join(', ')}`);
        }
        console.log('');
      });
    }
    
    // Check for egg and eggplant specifically
    console.log('==========================================');
    console.log('Checking egg vs eggplant (the key test):\n');
    
    const { data: eggData } = await supabase
      .from('ingredients')
      .select('id, canonical_name, category, subcategory, allergens')
      .in('canonical_name', ['egg', 'eggplant']);
    
    if (eggData) {
      eggData.forEach(ing => {
        console.log(`${ing.canonical_name}:`);
        console.log(`  ID: ${ing.id}`);
        console.log(`  Category: ${ing.category}`);
        console.log(`  Subcategory: ${ing.subcategory || 'N/A'}`);
        console.log(`  Allergens: ${ing.allergens ? ing.allergens.join(', ') : 'None'}`);
        console.log('');
      });
      
      if (eggData.length === 2) {
        const egg = eggData.find(i => i.canonical_name === 'egg');
        const eggplant = eggData.find(i => i.canonical_name === 'eggplant');
        
        if (egg && eggplant && egg.id !== eggplant.id && egg.category !== eggplant.category) {
          console.log('✅ PERFECT: "egg" and "eggplant" are SEPARATE entities with DIFFERENT categories!');
          console.log(`   egg (ID ${egg.id}) is ${egg.category}`);
          console.log(`   eggplant (ID ${eggplant.id}) is ${eggplant.category}`);
        }
      }
    }
    
    console.log('');
    console.log('==========================================');
    console.log('VERIFICATION SUMMARY:\n');
    
    console.log('Phase 3 is complete if you see:');
    console.log('  ✅ Thousands of ingredients extracted');
    console.log('  ✅ Multiple categories populated');
    console.log('  ✅ "egg" and "eggplant" are separate entities');
    console.log('  ✅ Allergen info added to common allergens');
    console.log('  ✅ Aliases added for variations\n');
    
    console.log('Next Steps:');
    console.log('  📋 Phase 4: Create product-ingredient mappings (Week 4-5)');
    console.log('  🎯 This is where we link products to ingredients');
    console.log('  🎯 This is where the eggplant/egg fix actually happens!\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyPhase3();

