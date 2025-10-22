require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testSemanticMatching() {
  console.log('🧪 Testing Semantic Matching System');
  console.log('==========================================\n');
  
  try {
    // Test 1: Check if ingredient exists
    console.log('Test 1: Check if "egg" ingredient exists...');
    const { data: eggIngredient, error: eggError } = await supabase
      .from('ingredients')
      .select('id, canonical_name, category, subcategory')
      .eq('canonical_name', 'egg')
      .single();
    
    if (eggError || !eggIngredient) {
      console.log('❌ "egg" ingredient NOT FOUND in ingredients table');
      console.log('   This means semantic matching cannot work!');
      return;
    }
    
    console.log(`✅ "egg" ingredient found: ID ${eggIngredient.id} (${eggIngredient.category}/${eggIngredient.subcategory})`);
    console.log('');
    
    // Test 2: Check if mappings exist for egg
    console.log('Test 2: Check if product mappings exist for "egg"...');
    const { data: eggMappings, error: mappingError } = await supabase
      .from('ingredient_product_mapping')
      .select('product_id, confidence_score, match_type')
      .eq('ingredient_id', eggIngredient.id)
      .gte('confidence_score', 0.80)
      .order('confidence_score', { ascending: false })
      .limit(5);
    
    if (mappingError || !eggMappings || eggMappings.length === 0) {
      console.log('❌ No product mappings found for "egg"');
      console.log('   Semantic matching will fallback to legacy!');
      return;
    }
    
    console.log(`✅ Found ${eggMappings.length} product mappings for "egg"`);
    console.log('');
    
    // Test 3: Fetch actual products
    console.log('Test 3: Fetch products via semantic mapping...');
    const productIds = eggMappings.map(m => m.product_id);
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, brand_name')
      .in('id', productIds);
    
    if (productError || !products) {
      console.log('❌ Could not fetch products from products table');
      console.log('   Error:', productError?.message);
      return;
    }
    
    console.log(`✅ Successfully fetched ${products.length} products:`);
    products.forEach((p, i) => {
      const mapping = eggMappings.find(m => m.product_id === p.id);
      console.log(`   ${i + 1}. ${p.name} (confidence: ${mapping?.confidence_score})`);
    });
    console.log('');
    
    // Test 4: Check if any are eggplant (should be ZERO!)
    const hasEggplant = products.some(p => 
      p.name.toLowerCase().includes('eggplant')
    );
    
    if (hasEggplant) {
      console.log('❌ PROBLEM: Found eggplant products in egg mappings!');
      console.log('   The fix is NOT working correctly');
    } else {
      console.log('✅ PERFECT: NO eggplant products in egg mappings!');
      console.log('   The semantic system is working correctly!');
    }
    console.log('');
    
    // Test 5: Check Edge Function status
    console.log('==========================================');
    console.log('Test 4: Edge Function Status\n');
    console.log('⚠️  IMPORTANT: The Edge Function must be deployed with the new code!');
    console.log('');
    console.log('To check if semantic matching is active:');
    console.log('  1. Open a recipe with "egg" in ingredients');
    console.log('  2. Check browser console for logs');
    console.log('  3. Look for: "[MATCHING] Using SEMANTIC matching" or "[MATCHING] Using LEGACY"');
    console.log('');
    console.log('If you see LEGACY, either:');
    console.log('  a) Edge Function not deployed yet');
    console.log('  b) USE_SEMANTIC_MATCHING flag is false (default)');
    console.log('');
    console.log('To activate semantic matching:');
    console.log('  1. Deploy Edge Function: supabase functions deploy recipe-processor');
    console.log('  2. Set secret: USE_SEMANTIC_MATCHING=true in Supabase Dashboard');
    console.log('');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSemanticMatching();

