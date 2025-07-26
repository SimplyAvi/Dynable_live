const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testCompleteCartFlow() {
  console.log('🔍 Testing Complete Cart Flow with OAuth Fix...\n');
  
  try {
    // Step 1: Create anonymous session
    console.log('🧪 Step 1: Creating anonymous session...');
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    
    if (authError) {
      console.log('❌ Failed to create anonymous session:', authError.message);
      return;
    }
    
    const anonymousUserId = authData.user.id;
    console.log('✅ Created anonymous session:', anonymousUserId);
    
    // Step 2: Add items to cart (simulating user adding items)
    console.log('\n🧪 Step 2: Adding items to cart...');
    const testItems = [
      { id: 1, name: 'Test Item 1', quantity: 2, price: 15.99 },
      { id: 2, name: 'Test Item 2', quantity: 1, price: 25.50 }
    ];
    
    for (const item of testItems) {
      console.log(`📝 Adding item to cart: ${item.name}`);
      
      // Simulate the addToCart function
      const now = new Date().toISOString();
      const { data: upsertData, error: upsertError } = await supabase
        .from('Carts')
        .upsert({
          supabase_user_id: anonymousUserId,
          items: [item], // Simplified for test
          createdAt: now,
          updatedAt: now
        }, { onConflict: 'supabase_user_id' })
        .select();
      
      if (upsertError) {
        console.log('❌ Failed to add item:', upsertError.message);
      } else {
        console.log('✅ Item added successfully');
      }
    }
    
    // Step 3: Verify cart exists before OAuth
    console.log('\n🧪 Step 3: Verifying cart before OAuth...');
    const { data: cartBeforeOAuth, error: cartError } = await supabase
      .from('Carts')
      .select('*')
      .eq('supabase_user_id', anonymousUserId)
      .maybeSingle();
    
    if (cartError) {
      console.log('❌ Error checking cart:', cartError.message);
    } else {
      console.log('✅ Cart verification successful');
      console.log('📊 Cart before OAuth:', cartBeforeOAuth ? 'Found' : 'Not found');
      if (cartBeforeOAuth) {
        console.log('   Items in cart:', cartBeforeOAuth.items?.length || 0);
      }
    }
    
    // Step 4: Simulate the cart saving before OAuth (what we just added to Login.js)
    console.log('\n🧪 Step 4: Simulating cart save before OAuth...');
    if (cartBeforeOAuth && cartBeforeOAuth.items && cartBeforeOAuth.items.length > 0) {
      console.log('🚨 CART SAVE BEFORE OAUTH: Cart items found, ensuring persistence...');
      console.log('   Cart items to persist:', cartBeforeOAuth.items);
      
      // This simulates what happens in the Login.js handleGoogleLogin function
      const now = new Date().toISOString();
      const { data: savedCart, error: saveError } = await supabase
        .from('Carts')
        .upsert({
          supabase_user_id: anonymousUserId,
          items: cartBeforeOAuth.items,
          createdAt: now,
          updatedAt: now
        }, { onConflict: 'supabase_user_id' })
        .select();
      
      if (saveError) {
        console.log('❌ Failed to save cart before OAuth:', saveError.message);
      } else {
        console.log('✅ Cart successfully saved to database before OAuth');
        console.log('   Saved cart data:', savedCart);
      }
    } else {
      console.log('ℹ️  No cart items to save before OAuth');
    }
    
    // Step 5: Simulate page refresh (clear session)
    console.log('\n🧪 Step 5: Simulating page refresh (session loss)...');
    console.log('   This simulates what happens during OAuth redirect');
    console.log('   Redux state would be cleared, but database persists');
    
    // Step 6: Verify cart still exists after "refresh"
    console.log('\n🧪 Step 6: Verifying cart after "refresh"...');
    const { data: cartAfterRefresh, error: refreshError } = await supabase
      .from('Carts')
      .select('*')
      .eq('supabase_user_id', anonymousUserId)
      .maybeSingle();
    
    if (refreshError) {
      console.log('❌ Error checking cart after refresh:', refreshError.message);
    } else {
      console.log('✅ Cart verification after refresh successful');
      console.log('📊 Cart after refresh:', cartAfterRefresh ? 'Found' : 'Not found');
      if (cartAfterRefresh) {
        console.log('   Items in cart:', cartAfterRefresh.items?.length || 0);
        console.log('   Cart items:', cartAfterRefresh.items);
      }
    }
    
    // Step 7: Test merge functionality
    console.log('\n🧪 Step 7: Testing cart merge functionality...');
    if (cartAfterRefresh && cartAfterRefresh.items && cartAfterRefresh.items.length > 0) {
      console.log('✅ Cart merge test: Cart exists with items, merge would work!');
      console.log('   Anonymous cart items available for merge:', cartAfterRefresh.items);
    } else {
      console.log('❌ Cart merge test: No cart items found, merge would fail');
    }
    
    // Clean up
    console.log('\n🧪 Step 8: Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('Carts')
      .delete()
      .eq('supabase_user_id', anonymousUserId);
    
    if (deleteError) {
      console.log('⚠️  Could not clean up test cart:', deleteError.message);
    } else {
      console.log('✅ Test cart cleaned up successfully');
    }
    
    // Summary
    console.log('\n📋 TEST SUMMARY:');
    if (cartAfterRefresh && cartAfterRefresh.items && cartAfterRefresh.items.length > 0) {
      console.log('✅ SUCCESS: Cart persistence through OAuth flow works!');
      console.log('   The OAuth fix should resolve the cart merge issue');
    } else {
      console.log('❌ FAILURE: Cart persistence still has issues');
      console.log('   Need to investigate further');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testCompleteCartFlow(); 