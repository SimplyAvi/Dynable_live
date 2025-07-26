/**
 * Simple Cart Merge Test
 * Tests the cart merge functionality using real authentication
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testSimpleCartMerge() {
  console.log('🧪 Starting simple cart merge test...\n');
  
  try {
    // 🎯 STEP 1: Create anonymous session
    console.log('📋 STEP 1: Creating anonymous session...');
    const { data: anonymousData, error: anonymousError } = await supabase.auth.signInAnonymously();
    
    if (anonymousError) {
      console.error('❌ Failed to create anonymous session:', anonymousError);
      return;
    }
    
    const anonymousUserId = anonymousData.user.id;
    console.log('✅ Anonymous session created:', anonymousUserId);
    
    // 🎯 STEP 2: Add items to anonymous cart
    console.log('\n📋 STEP 2: Adding items to anonymous cart...');
    const testItems = [
      {
        id: 'test-product-1',
        name: 'Test Product 1',
        brandName: 'Test Brand',
        price: 15.99,
        quantity: 2,
        image: '/test-image-1.png'
      },
      {
        id: 'test-product-2',
        name: 'Test Product 2',
        brandName: 'Test Brand',
        price: 25.50,
        quantity: 1,
        image: '/test-image-2.png'
      }
    ];
    
    // Add items one by one to simulate the real flow
    for (const item of testItems) {
      console.log(`Adding item: ${item.name}`);
      
      // Get current cart
      const { data: currentCart } = await supabase
        .from('Carts')
        .select('items')
        .eq('supabase_user_id', anonymousUserId)
        .maybeSingle();
      
      const currentItems = currentCart?.items || [];
      
      // Add/update item
      const existingIndex = currentItems.findIndex(cartItem => cartItem.id === item.id);
      if (existingIndex !== -1) {
        currentItems[existingIndex].quantity += item.quantity;
      } else {
        currentItems.push(item);
      }
      
      // Save to database
      const { data: upsertData, error: upsertError } = await supabase
        .from('Carts')
        .upsert({
          supabase_user_id: anonymousUserId,
          items: currentItems,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { onConflict: 'supabase_user_id' })
        .select();
      
      if (upsertError) {
        console.error('❌ Failed to add item:', upsertError);
        return;
      }
    }
    
    // Verify anonymous cart was created
    const { data: anonymousCart } = await supabase
      .from('Carts')
      .select('items')
      .eq('supabase_user_id', anonymousUserId)
      .maybeSingle();
    
    console.log('✅ Anonymous cart created with items:', anonymousCart?.items?.length || 0);
    console.log('📦 Anonymous cart items:', anonymousCart?.items);
    
    // 🎯 STEP 3: Test the merge function directly
    console.log('\n📋 STEP 3: Testing merge function...');
    
    // For this test, we'll use the same user ID to simulate the merge
    // In real flow, this would be a different authenticated user
    const mergeResult = await testMergeLogic(anonymousUserId, anonymousUserId);
    
    if (mergeResult.success) {
      console.log('✅ Merge test completed successfully');
      console.log('📊 Merge summary:', mergeResult.summary);
    } else {
      console.error('❌ Merge test failed:', mergeResult.error);
    }
    
    console.log('\n🎉 Simple cart merge test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// 🎯 TEST MERGE LOGIC
async function testMergeLogic(anonymousUserId, authenticatedUserId) {
  console.log('[TEST MERGE] 🚀 Starting test merge...');
  
  try {
    // Get anonymous cart
    const { data: anonymousCart, error: anonymousError } = await supabase
      .from('Carts')
      .select('items, updatedAt')
      .eq('supabase_user_id', anonymousUserId)
      .maybeSingle();
    
    if (anonymousError) {
      return { success: false, error: 'Failed to fetch anonymous cart: ' + anonymousError.message };
    }
    
    if (!anonymousCart) {
      return { success: true, mergedItems: [], message: 'No anonymous cart found' };
    }
    
    const anonymousItems = anonymousCart.items || [];
    console.log('[TEST MERGE] ✅ Anonymous cart found with', anonymousItems.length, 'items');
    
    if (anonymousItems.length === 0) {
      return { success: true, mergedItems: [], message: 'Anonymous cart is empty' };
    }
    
    // Get authenticated cart (same as anonymous for this test)
    const { data: authenticatedCart, error: authenticatedError } = await supabase
      .from('Carts')
      .select('items, updatedAt')
      .eq('supabase_user_id', authenticatedUserId)
      .maybeSingle();
    
    if (authenticatedError) {
      return { success: false, error: 'Failed to fetch authenticated cart: ' + authenticatedError.message };
    }
    
    const authenticatedItems = authenticatedCart?.items || [];
    console.log('[TEST MERGE] ✅ Authenticated cart found with', authenticatedItems.length, 'items');
    
    // Merge carts
    const mergeResult = testMergeCarts(anonymousItems, authenticatedItems);
    console.log('[TEST MERGE] ✅ Merge completed:', mergeResult);
    
    // Save merged cart
    const now = new Date().toISOString();
    const { data: savedCart, error: saveError } = await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: authenticatedUserId,
        items: mergeResult.mergedItems,
        createdAt: now,
        updatedAt: now
      }, { onConflict: 'supabase_user_id' })
      .select();
    
    if (saveError) {
      return { success: false, error: 'Failed to save merged cart: ' + saveError.message };
    }
    
    console.log('[TEST MERGE] ✅ Merged cart saved successfully');
    
    return { 
      success: true, 
      mergedItems: mergeResult.mergedItems,
      summary: {
        anonymousItemsCount: anonymousItems.length,
        authenticatedItemsCount: authenticatedItems.length,
        mergedItemsCount: mergeResult.mergedItems.length,
        itemsAdded: mergeResult.itemsAdded,
        quantitiesCombined: mergeResult.quantitiesCombined
      }
    };
    
  } catch (error) {
    return { success: false, error: 'Merge operation failed: ' + error.message };
  }
}

// 🎯 ENHANCED MERGE LOGIC FOR TESTING
function testMergeCarts(anonymousItems, authenticatedItems) {
  console.log('[TEST MERGE LOGIC] 🔄 Starting cart merge logic...');
  
  const mergedItems = [...authenticatedItems];
  let itemsAdded = 0;
  let quantitiesCombined = 0;
  let itemsSkipped = 0;
  
  anonymousItems.forEach((anonymousItem, index) => {
    console.log(`[TEST MERGE LOGIC] Processing anonymous item ${index + 1}/${anonymousItems.length}:`, anonymousItem);
    
    if (!anonymousItem.id) {
      console.warn(`[TEST MERGE LOGIC] ⚠️  Skipping item without ID:`, anonymousItem);
      itemsSkipped++;
      return;
    }
    
    const existingIndex = mergedItems.findIndex(item => item.id === anonymousItem.id);
    
    if (existingIndex !== -1) {
      // Item exists - combine quantities
      const oldQuantity = mergedItems[existingIndex].quantity;
      const addedQuantity = anonymousItem.quantity || 1;
      mergedItems[existingIndex].quantity += addedQuantity;
      quantitiesCombined++;
      
      console.log(`[TEST MERGE LOGIC] ✅ Combined quantities for item ${anonymousItem.id}:`, {
        oldQuantity,
        addedQuantity,
        newQuantity: mergedItems[existingIndex].quantity
      });
    } else {
      // New item - add to cart
      const itemToAdd = {
        ...anonymousItem,
        quantity: anonymousItem.quantity || 1
      };
      mergedItems.push(itemToAdd);
      itemsAdded++;
      
      console.log(`[TEST MERGE LOGIC] ✅ Added new item ${anonymousItem.id}:`, itemToAdd);
    }
  });
  
  const result = {
    mergedItems,
    itemsAdded,
    quantitiesCombined,
    itemsSkipped
  };
  
  console.log('[TEST MERGE LOGIC] ✅ Enhanced merge logic completed:', result);
  return result;
}

// Run the test
testSimpleCartMerge(); 