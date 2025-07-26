const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testRLSCarts() {
  console.log('🔍 Testing RLS policies on Carts table...\n');
  
  try {
    // Test 1: Try to access Carts table as anonymous user
    console.log('🧪 Test 1: Anonymous user accessing Carts table');
    const { data: anonymousCarts, error: anonymousError } = await supabase
      .from('Carts')
      .select('*')
      .limit(5);
    
    if (anonymousError) {
      console.log('❌ Anonymous access blocked:', anonymousError.message);
    } else {
      console.log('✅ Anonymous access allowed');
      console.log(`   Found ${anonymousCarts?.length || 0} carts`);
    }
    
    // Test 2: Try to access specific cart by ID
    console.log('\n🧪 Test 2: Accessing specific cart by ID');
    const testCartId = '876a009a-aa2d-4f7f-aa14-71ee4ec91e8a';
    const { data: specificCart, error: specificError } = await supabase
      .from('Carts')
      .select('*')
      .eq('supabase_user_id', testCartId)
      .maybeSingle();
    
    if (specificError) {
      console.log('❌ Specific cart access blocked:', specificError.message);
    } else {
      console.log('✅ Specific cart access allowed');
      console.log(`   Cart found: ${specificCart ? 'Yes' : 'No'}`);
      if (specificCart) {
        console.log(`   Items in cart: ${specificCart.items?.length || 0}`);
      }
    }
    
    // Test 3: Try to insert a test cart
    console.log('\n🧪 Test 3: Inserting test cart');
    const testCart = {
      supabase_user_id: 'test-anonymous-user',
      items: [{ id: 1, name: 'Test Item', quantity: 1 }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('Carts')
      .insert(testCart)
      .select();
    
    if (insertError) {
      console.log('❌ Cart insert blocked:', insertError.message);
    } else {
      console.log('✅ Cart insert allowed');
      console.log(`   Inserted cart ID: ${insertData?.[0]?.id}`);
      
      // Clean up - delete the test cart
      const { error: deleteError } = await supabase
        .from('Carts')
        .delete()
        .eq('supabase_user_id', 'test-anonymous-user');
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test cart:', deleteError.message);
      } else {
        console.log('✅ Test cart cleaned up');
      }
    }
    
    // Test 4: Check if we can access carts from different users
    console.log('\n🧪 Test 4: Cross-user cart access');
    const { data: allCarts, error: allCartsError } = await supabase
      .from('Carts')
      .select('supabase_user_id, items')
      .limit(10);
    
    if (allCartsError) {
      console.log('❌ Cross-user access blocked:', allCartsError.message);
    } else {
      console.log('✅ Cross-user access allowed');
      console.log(`   Total carts accessible: ${allCarts?.length || 0}`);
      if (allCarts && allCarts.length > 0) {
        console.log('   Sample user IDs:');
        allCarts.slice(0, 3).forEach((cart, index) => {
          console.log(`     ${index + 1}. ${cart.supabase_user_id} (${cart.items?.length || 0} items)`);
        });
      }
    }
    
    console.log('\n📋 RLS Policy Analysis:');
    if (anonymousError && specificError && insertError) {
      console.log('🔒 RLS is BLOCKING all access - this is the problem!');
      console.log('   Solution: Need to modify RLS policies to allow cart merging');
    } else if (!anonymousError && !specificError && !insertError) {
      console.log('✅ RLS is allowing access - RLS is not the problem');
    } else {
      console.log('⚠️  Mixed RLS behavior - some operations allowed, others blocked');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testRLSCarts(); 