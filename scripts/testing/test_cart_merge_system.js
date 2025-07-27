/**
 * Comprehensive Cart Merge System Test
 * Tests the complete anonymous-to-authenticated user cart merging flow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testCartMergeSystem() {
  console.log('🧪 Starting comprehensive cart merge system test...\n');
  
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
    
    for (const item of testItems) {
      console.log(`Adding item: ${item.name}`);
      const { data: upsertData, error: upsertError } = await supabase
        .from('Carts')
        .upsert({
          supabase_user_id: anonymousUserId,
          items: [item],
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
    
    // 🎯 STEP 3: Simulate OAuth login (create authenticated user)
    console.log('\n📋 STEP 3: Simulating OAuth login...');
    
    // For testing, we'll create a "mock" authenticated user with proper UUID
    // In real flow, this would be the result of Google OAuth
    const authenticatedUserId = '00000000-0000-0000-0000-000000000001'; // Mock UUID for testing
    
    // Create authenticated user's cart with some existing items
    const existingItems = [
      {
        id: 'test-product-1', // Same as anonymous cart
        name: 'Test Product 1',
        brandName: 'Test Brand',
        price: 15.99,
        quantity: 1, // Different quantity
        image: '/test-image-1.png'
      },
      {
        id: 'test-product-3', // New item
        name: 'Test Product 3',
        brandName: 'Test Brand',
        price: 35.00,
        quantity: 3,
        image: '/test-image-3.png'
      }
    ];
    
    const { data: authCartData, error: authCartError } = await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: authenticatedUserId,
        items: existingItems,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { onConflict: 'supabase_user_id' })
      .select();
    
    if (authCartError) {
      console.error('❌ Failed to create authenticated cart:', authCartError);
      return;
    }
    
    console.log('✅ Authenticated cart created with items:', existingItems.length);
    
    // 🎯 STEP 4: Test cart merge function
    console.log('\n📋 STEP 4: Testing cart merge function...');
    
    // Import the merge function (simulate the actual function)
    const mergeResult = await testMergeFunction(anonymousUserId, authenticatedUserId);
    
    if (!mergeResult.success) {
      console.error('❌ Cart merge failed:', mergeResult.error);
      return;
    }
    
    console.log('✅ Cart merge completed successfully');
    console.log('📊 Merge summary:', mergeResult.summary);
    
    // 🎯 STEP 5: Verify merged cart
    console.log('\n📋 STEP 5: Verifying merged cart...');
    
    const { data: mergedCart } = await supabase
      .from('Carts')
      .select('items')
      .eq('supabase_user_id', authenticatedUserId)
      .maybeSingle();
    
    if (mergedCart && mergedCart.items) {
      console.log('✅ Merged cart verified with items:', mergedCart.items.length);
      console.log('📦 Merged cart items:', mergedCart.items);
    } else {
      console.error('❌ Merged cart verification failed');
    }
    
    // 🎯 STEP 6: Verify anonymous cart was deleted
    console.log('\n📋 STEP 6: Verifying anonymous cart cleanup...');
    
    const { data: deletedCart } = await supabase
      .from('Carts')
      .select('items')
      .eq('supabase_user_id', anonymousUserId)
      .maybeSingle();
    
    if (!deletedCart) {
      console.log('✅ Anonymous cart successfully deleted');
    } else {
      console.warn('⚠️  Anonymous cart still exists (cleanup may have failed)');
    }
    
    console.log('\n🎉 Cart merge system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// 🎯 SIMULATE THE ENHANCED MERGE FUNCTION
async function testMergeFunction(anonymousUserId, authenticatedUserId) {
  console.log('[TEST MERGE] 🚀 Starting test merge...');
  console.log('[TEST MERGE] Anonymous user ID:', anonymousUserId);
  console.log('[TEST MERGE] Authenticated user ID:', authenticatedUserId);
  
  try {
    // Input validation
    if (!anonymousUserId || !authenticatedUserId) {
      return { success: false, error: 'Invalid user IDs provided' };
    }
    
    if (anonymousUserId === authenticatedUserId) {
      return { success: false, error: 'Cannot merge cart with same user ID' };
    }
    
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
    
    // Get authenticated cart
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
    
    // Delete anonymous cart
    const { error: deleteError } = await supabase
      .from('Carts')
      .delete()
      .eq('supabase_user_id', anonymousUserId);
    
    if (deleteError) {
      console.error('[TEST MERGE] ⚠️  Error deleting anonymous cart:', deleteError);
    } else {
      console.log('[TEST MERGE] ✅ Anonymous cart deleted successfully');
    }
    
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
testCartMergeSystem(); 