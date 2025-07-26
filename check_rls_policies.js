const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Checking RLS policies on Carts table...');
    
    // Check if RLS is enabled
    const { data: rlsEnabled, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('is_insertable_into, is_updatable, is_deletable')
      .eq('table_name', 'Carts')
      .eq('table_schema', 'public')
      .single();
    
    if (rlsError) {
      console.error('❌ Error checking RLS status:', rlsError);
      return;
    }
    
    console.log('📋 RLS Status for Carts table:', rlsEnabled);
    
    // Try to query the Carts table to see what happens
    console.log('🧪 Testing Carts table access...');
    
    const { data: carts, error: cartsError } = await supabase
      .from('Carts')
      .select('*')
      .limit(5);
    
    if (cartsError) {
      console.error('❌ Error accessing Carts table:', cartsError);
      console.log('🔒 This suggests RLS is blocking access');
    } else {
      console.log('✅ Successfully accessed Carts table');
      console.log('📊 Found carts:', carts?.length || 0);
    }
    
    // Test with a specific user ID
    console.log('🧪 Testing access with specific user ID...');
    
    const { data: specificCart, error: specificError } = await supabase
      .from('Carts')
      .select('*')
      .eq('supabase_user_id', '876a009a-aa2d-4f7f-aa14-71ee4ec91e8a')
      .maybeSingle();
    
    if (specificError) {
      console.error('❌ Error accessing specific cart:', specificError);
    } else {
      console.log('✅ Successfully accessed specific cart:', specificCart ? 'Found' : 'Not found');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkRLSPolicies(); 