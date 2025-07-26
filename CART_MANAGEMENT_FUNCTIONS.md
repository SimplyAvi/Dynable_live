# Cart Management Functions

## Core Cart Operations

### 1. Add Item to Cart
```javascript
// anonymousAuth.js
export const addToCart = async (item) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'No session found' };
    }
    
    // Get current cart items
    const currentItems = await getCart();
    
    // Check if item already exists
    const existingItemIndex = currentItems.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      currentItems[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      currentItems.push(item);
    }
    
    // Upsert cart in database
    const now = new Date().toISOString();
    const { data: upsertData, error: upsertError } = await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: session.user.id,
        items: currentItems,
        createdAt: now,
        updatedAt: now
      }, { onConflict: 'supabase_user_id' })
      .select();
    
    if (upsertError) {
      return { success: false, error: upsertError.message };
    }
    
    return { success: true, items: currentItems };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 2. Get Cart Items
```javascript
// anonymousAuth.js
export const getCart = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return [];
    }
    
    const { data: cart, error } = await supabase
      .from('Carts')
      .select('items')
      .eq('supabase_user_id', session.user.id)
      .maybeSingle();
    
    if (error) {
      return [];
    }
    
    return cart?.items || [];
  } catch (error) {
    return [];
  }
};
```

### 3. Update Cart Item Quantity
```javascript
// anonymousAuth.js
export const updateCartItemQuantity = async (itemId, quantity) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'No session found' };
    }
    
    const currentItems = await getCart();
    const itemIndex = currentItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return { success: false, error: 'Item not found in cart' };
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      currentItems.splice(itemIndex, 1);
    } else {
      // Update quantity
      currentItems[itemIndex].quantity = quantity;
    }
    
    // Save updated cart
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: session.user.id,
        items: currentItems,
        createdAt: now,
        updatedAt: now
      }, { onConflict: 'supabase_user_id' });
    
    if (upsertError) {
      return { success: false, error: upsertError.message };
    }
    
    return { success: true, items: currentItems };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 4. Remove Item from Cart
```javascript
// anonymousAuth.js
export const removeFromCart = async (itemId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'No session found' };
    }
    
    const currentItems = await getCart();
    const filteredItems = currentItems.filter(item => item.id !== itemId);
    
    // Save updated cart
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: session.user.id,
        items: filteredItems,
        createdAt: now,
        updatedAt: now
      }, { onConflict: 'supabase_user_id' });
    
    if (upsertError) {
      return { success: false, error: upsertError.message };
    }
    
    return { success: true, items: filteredItems };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 5. Clear Cart
```javascript
// anonymousAuth.js
export const clearCart = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'No session found' };
    }
    
    // Clear cart by setting empty items array
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: session.user.id,
        items: [],
        createdAt: now,
        updatedAt: now
      }, { onConflict: 'supabase_user_id' });
    
    if (upsertError) {
      return { success: false, error: upsertError.message };
    }
    
    return { success: true, items: [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Cart Merge Functions

### 6. Merge Anonymous Cart with Authenticated User
```javascript
// anonymousAuth.js
export const mergeAnonymousCartWithStoredId = async (anonymousUserId, authenticatedUserId) => {
  try {
    console.log('[ANONYMOUS AUTH] Starting cart merge...');
    console.log('[ANONYMOUS AUTH] Anonymous user ID:', anonymousUserId);
    console.log('[ANONYMOUS AUTH] Authenticated user ID:', authenticatedUserId);
    
    // Get anonymous cart
    const { data: anonymousCart, error: anonymousError } = await supabase
      .from('Carts')
      .select('items')
      .eq('supabase_user_id', anonymousUserId)
      .maybeSingle();
    
    if (anonymousError) {
      console.error('[ANONYMOUS AUTH] Error fetching anonymous cart:', anonymousError);
      return { success: false, error: anonymousError.message };
    }
    
    const anonymousItems = anonymousCart?.items || [];
    console.log('[ANONYMOUS AUTH] Anonymous cart items:', anonymousItems);
    
    // Get authenticated cart
    const { data: authenticatedCart, error: authenticatedError } = await supabase
      .from('Carts')
      .select('items')
      .eq('supabase_user_id', authenticatedUserId)
      .maybeSingle();
    
    if (authenticatedError) {
      console.error('[ANONYMOUS AUTH] Error fetching authenticated cart:', authenticatedError);
      return { success: false, error: authenticatedError.message };
    }
    
    const authenticatedItems = authenticatedCart?.items || [];
    console.log('[ANONYMOUS AUTH] Authenticated cart items:', authenticatedItems);
    
    // Merge carts
    const mergedItems = mergeCarts(anonymousItems, authenticatedItems);
    console.log('[ANONYMOUS AUTH] Merged cart items:', mergedItems);
    
    // Save merged cart to authenticated user
    const now = new Date().toISOString();
    const { error: saveError } = await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: authenticatedUserId,
        items: mergedItems,
        createdAt: now,
        updatedAt: now
      }, { onConflict: 'supabase_user_id' });
    
    if (saveError) {
      console.error('[ANONYMOUS AUTH] Error saving merged cart:', saveError);
      return { success: false, error: saveError.message };
    }
    
    // Delete anonymous cart
    const { error: deleteError } = await supabase
      .from('Carts')
      .delete()
      .eq('supabase_user_id', anonymousUserId);
    
    if (deleteError) {
      console.error('[ANONYMOUS AUTH] Error deleting anonymous cart:', deleteError);
      // Don't fail the merge if cleanup fails
    }
    
    console.log('[ANONYMOUS AUTH] Cart merge completed successfully');
    return { success: true, mergedItems };
    
  } catch (error) {
    console.error('[ANONYMOUS AUTH] Error in cart merge:', error);
    return { success: false, error: error.message };
  }
};
```

### 7. Cart Merging Logic
```javascript
// anonymousAuth.js
function mergeCarts(anonymousItems, authenticatedItems) {
  const mergedItems = [...authenticatedItems];
  
  anonymousItems.forEach(anonymousItem => {
    const existingIndex = mergedItems.findIndex(item => item.id === anonymousItem.id);
    
    if (existingIndex !== -1) {
      // Item exists - combine quantities
      mergedItems[existingIndex].quantity += anonymousItem.quantity;
      console.log('[ANONYMOUS AUTH] Combined quantities for item:', anonymousItem.id);
    } else {
      // New item - add to cart
      mergedItems.push(anonymousItem);
      console.log('[ANONYMOUS AUTH] Added new item to cart:', anonymousItem.id);
    }
  });
  
  return mergedItems;
}
```

## Redux Integration

### 8. Redux Thunks
```javascript
// anonymousCartSlice.js
export const addItemToCart = createAsyncThunk(
  'anonymousCart/addItemToCart',
  async (item) => {
    const result = await addToCart(item);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.items;
  }
);

export const fetchCart = createAsyncThunk(
  'anonymousCart/fetchCart',
  async () => {
    const items = await getCart();
    return items || [];
  }
);

export const mergeAnonymousCartWithServer = createAsyncThunk(
  'anonymousCart/mergeAnonymousCartWithServer',
  async (anonymousUserId, authenticatedUserId) => {
    const result = await mergeAnonymousCartWithStoredId(anonymousUserId, authenticatedUserId);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.mergedItems;
  }
);
```

## Error Handling

### 9. Error Response Format
```javascript
// Standard error response format
{
  success: false,
  error: 'Error message',
  items: [] // Empty array on error
}

// Standard success response format
{
  success: true,
  items: [...] // Cart items array
}
```

## Key Design Principles

### Database-First Operations
- **All cart operations** save to database immediately
- **Redux state** is updated after successful database operations
- **Error handling** prevents inconsistent state

### Session Management
- **Session validation** before every cart operation
- **Anonymous sessions** treated same as authenticated sessions
- **User ID isolation** ensures cart privacy

### Merge Strategy
- **Quantity combination** for duplicate items
- **Item addition** for new items
- **Anonymous cart cleanup** after successful merge
- **Error tolerance** for cleanup failures 