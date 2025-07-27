const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testSpecificCart() {
  console.log('🔍 Testing access to specific cart from user test...\n');
  
  // The anonymous user ID from the logs
  const anonymousUserId = '876a009a-aa2d-4f7f-aa14-71ee4ec91e8a';
  
  try {
    console.log(`🧪 Testing access to cart for user: ${anonymousUserId}`);
    
    // Test 1: Try to access the specific cart
    const { data: cart, error: cartError } = await supabase
      .from('Carts')
      .select('*')
      .eq('supabase_user_id', anonymousUserId)
      .maybeSingle();
    
    if (cartError) {
      console.log('❌ Error accessing cart:', cartError.message);
    } else {
      console.log('✅ Successfully accessed cart');
      console.log('   Cart found:', cart ? 'Yes' : 'No');
      if (cart) {
        console.log('   Cart details:', {
          id: cart.id,
          supabase_user_id: cart.supabase_user_id,
          items_count: cart.items?.length || 0,
          created_at: cart.createdAt,
          updated_at: cart.updatedAt
        });
        if (cart.items && cart.items.length > 0) {
          console.log('   Items:', cart.items);
        }
      }
    }
    
    // Test 2: List all carts to see what's in the database
    console.log('\n🧪 Listing all carts in database...');
    const { data: allCarts, error: allCartsError } = await supabase
      .from('Carts')
      .select('supabase_user_id, items, createdAt, updatedAt')
      .order('createdAt', { ascending: false })
      .limit(10);
    
    if (allCartsError) {
      console.log('❌ Error listing carts:', allCartsError.message);
    } else {
      console.log('✅ Successfully listed carts');
      console.log(`   Total carts found: ${allCarts?.length || 0}`);
      
      if (allCarts && allCarts.length > 0) {
        console.log('   Carts in database:');
        allCarts.forEach((cart, index) => {
          console.log(`     ${index + 1}. User: ${cart.supabase_user_id}`);
          console.log(`        Items: ${cart.items?.length || 0}`);
          console.log(`        Created: ${cart.createdAt}`);
          console.log(`        Updated: ${cart.updatedAt}`);
        });
      } else {
        console.log('   No carts found in database');
      }
    }
    
    // Test 3: Check if the cart was actually saved
    console.log('\n🧪 Checking if cart was saved during test...');
    const targetCart = allCarts?.find(cart => cart.supabase_user_id === anonymousUserId);
    
    if (targetCart) {
      console.log('✅ Cart was found in database!');
      console.log('   This means the cart was saved successfully');
      console.log('   The merge issue is NOT related to cart storage');
    } else {
      console.log('❌ Cart was NOT found in database');
      console.log('   This means the cart was never saved');
      console.log('   The issue is in the addToCart function');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testSpecificCart(); 