const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testCartInsert() {
  console.log('🔍 Testing cart insertion directly...\n');
  
  try {
    // First, create an anonymous session
    console.log('🧪 Step 1: Creating anonymous session...');
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.log('❌ Failed to create anonymous session:', authError.message);
      return;
    }
    
    const anonymousUserId = authData.user.id;
    console.log('✅ Created anonymous session:', anonymousUserId);
    
    // Test cart insertion
    console.log('\n🧪 Step 2: Testing cart insertion...');
    const testCart = {
      supabase_user_id: anonymousUserId,
      items: [{ id: 1, name: 'Test Item', quantity: 1, price: 10 }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('📝 Attempting to insert cart:', testCart);
    
    const { data: insertData, error: insertError } = await supabase
      .from('Carts')
      .insert(testCart)
      .select();
    
    if (insertError) {
      console.log('❌ Cart insert failed:', insertError.message);
      console.log('🔍 Error details:', insertError);
    } else {
      console.log('✅ Cart insert successful!');
      console.log('📊 Inserted data:', insertData);
    }
    
    // Verify the cart was actually saved
    console.log('\n🧪 Step 3: Verifying cart was saved...');
    const { data: savedCart, error: verifyError } = await supabase
      .from('Carts')
      .select('*')
      .eq('supabase_user_id', anonymousUserId)
      .maybeSingle();
    
    if (verifyError) {
      console.log('❌ Error verifying cart:', verifyError.message);
    } else {
      console.log('✅ Cart verification successful');
      console.log('📊 Saved cart:', savedCart ? 'Found' : 'Not found');
      if (savedCart) {
        console.log('   Cart details:', {
          id: savedCart.id,
          supabase_user_id: savedCart.supabase_user_id,
          items_count: savedCart.items?.length || 0
        });
      }
    }
    
    // Clean up
    console.log('\n🧪 Step 4: Cleaning up test cart...');
    const { error: deleteError } = await supabase
      .from('Carts')
      .delete()
      .eq('supabase_user_id', anonymousUserId);
    
    if (deleteError) {
      console.log('⚠️  Could not clean up test cart:', deleteError.message);
    } else {
      console.log('✅ Test cart cleaned up successfully');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testCartInsert(); 