# Authentication Flow: Anonymous to Authenticated Users

## 1. Anonymous User Initialization

### App Startup Flow
```javascript
// App.js - useEffect
const checkExistingSession = async () => {
  console.log('[APP] Starting checkExistingSession...');
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    console.log('[APP] Session found:', session.user.id);
    console.log('[APP] Is anonymous session:', isAnonymousUser(session));
    
    if (isAnonymousUser(session)) {
      // Anonymous user - initialize cart
      dispatch(initializeAuth());
    } else {
      // Authenticated user - set credentials
      dispatch(setCredentials({
        user: session.user,
        token: session.access_token,
        isAuthenticated: true
      }));
    }
  } else {
    // No session - create anonymous user
    dispatch(initializeAuth());
  }
};
```

### Anonymous Session Creation
```javascript
// anonymousAuth.js - initializeAnonymousAuth
export const initializeAnonymousAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // Existing session found
    return { session, isAnonymous: isAnonymousUser(session), success: true };
  }
  
  // Create new anonymous session
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    return { session: null, isAnonymous: false, success: false, error: error.message };
  }
  
  return { session: data.session, isAnonymous: true, success: true };
};
```

## 2. Anonymous User Cart Operations

### Adding Items to Cart
```javascript
// ProductSelector.js / FoodCard.js
const handleAddToCart = async (product) => {
  const cartItem = {
    id: product.id,
    name: product.description,
    brandName: product.brandName,
    price: product.price || 0,
    quantity: 1,
    image: product.image || '/default_img.png'
  };

  // Use Redux thunk that calls anonymousAuth.js
  await dispatch(addItemToCart(cartItem)).unwrap();
};
```

### Database Persistence
```javascript
// anonymousAuth.js - addToCart
export const addToCart = async (item) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { success: false, error: 'No session found' };
  }
  
  // Get current cart items
  const currentItems = await getCart();
  
  // Add/update item
  const existingItemIndex = currentItems.findIndex(cartItem => cartItem.id === item.id);
  if (existingItemIndex !== -1) {
    currentItems[existingItemIndex].quantity += item.quantity;
  } else {
    currentItems.push(item);
  }
  
  // Save to database
  const { data: upsertData, error: upsertError } = await supabase
    .from('Carts')
    .upsert({
      supabase_user_id: session.user.id,
      items: currentItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { onConflict: 'supabase_user_id' })
    .select();
  
  if (upsertError) {
    return { success: false, error: upsertError.message };
  }
  
  return { success: true, items: currentItems };
};
```

## 3. Login Process

### Google OAuth Flow
```javascript
// Login.js - handleGoogleLogin
const handleGoogleLogin = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session && isAnonymousUser(session)) {
    const anonymousUserId = session.user.id;
    
    // 🎯 CRITICAL: Save cart to database before OAuth redirect
    if (cartItems && cartItems.length > 0) {
      for (const item of cartItems) {
        await addToCart(item);
      }
    }
    
    // Store anonymous user ID for merge
    localStorage.setItem('anonymousUserIdForMerge', anonymousUserId);
  }
  
  // Redirect to Google OAuth
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
};
```

### OAuth Callback Processing
```javascript
// GoogleCallback.js - useEffect
useEffect(() => {
  const handleAuthCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
      
      if (anonymousUserId) {
        // Perform cart merge
        await dispatch(mergeAnonymousCartWithServer(anonymousUserId, session.user.id));
        localStorage.removeItem('anonymousUserIdForMerge');
      }
      
      // Navigate to home
      navigate('/');
    }
  };
  
  handleAuthCallback();
}, []);
```

## 4. Cart Merge Process

### Merge Function
```javascript
// anonymousAuth.js - mergeAnonymousCartWithStoredId
export const mergeAnonymousCartWithStoredId = async (anonymousUserId, authenticatedUserId) => {
  try {
    // Get anonymous cart
    const { data: anonymousCart } = await supabase
      .from('Carts')
      .select('items')
      .eq('supabase_user_id', anonymousUserId)
      .maybeSingle();
    
    // Get authenticated cart
    const { data: authenticatedCart } = await supabase
      .from('Carts')
      .select('items')
      .eq('supabase_user_id', authenticatedUserId)
      .maybeSingle();
    
    // Merge carts
    const anonymousItems = anonymousCart?.items || [];
    const authenticatedItems = authenticatedCart?.items || [];
    const mergedItems = mergeCarts(anonymousItems, authenticatedItems);
    
    // Save merged cart
    await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: authenticatedUserId,
        items: mergedItems,
        updatedAt: new Date().toISOString()
      }, { onConflict: 'supabase_user_id' });
    
    // Delete anonymous cart
    await supabase
      .from('Carts')
      .delete()
      .eq('supabase_user_id', anonymousUserId);
    
    return { success: true, mergedItems };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Cart Merging Logic
```javascript
function mergeCarts(anonymousItems, authenticatedItems) {
  const mergedItems = [...authenticatedItems];
  
  anonymousItems.forEach(anonymousItem => {
    const existingIndex = mergedItems.findIndex(item => item.id === anonymousItem.id);
    
    if (existingIndex !== -1) {
      // Item exists - combine quantities
      mergedItems[existingIndex].quantity += anonymousItem.quantity;
    } else {
      // New item - add to cart
      mergedItems.push(anonymousItem);
    }
  });
  
  return mergedItems;
}
```

## 5. Session State Management

### Redux State Updates
```javascript
// anonymousCartSlice.js - extraReducers
builder.addCase(initializeAuth.fulfilled, (state, action) => {
  state.loading = false;
  state.session = action.payload.session;
  state.isAnonymous = action.payload.isAnonymous;
});

builder.addCase(mergeAnonymousCartWithServer.fulfilled, (state, action) => {
  if (action.payload.success) {
    state.items = action.payload.mergedItems;
  }
});
```

### localStorage Usage
```javascript
// Anonymous user ID tracking
localStorage.setItem('anonymousUserIdForMerge', anonymousUserId);
localStorage.removeItem('anonymousUserIdForMerge');

// Post-login redirect
localStorage.setItem('postLoginRedirect', '/checkout');
localStorage.removeItem('postLoginRedirect');
```

## 6. Key Flow Summary

### Anonymous User Journey
1. **Visit site** → Create anonymous session
2. **Add items** → Save to database + Redux state
3. **Click login** → Save cart to database before OAuth
4. **OAuth redirect** → Page refresh (Redux state lost)
5. **OAuth callback** → Merge anonymous cart with authenticated cart
6. **Success** → Anonymous cart deleted, merged cart saved

### Critical Points
- **Database persistence** ensures cart survives page refresh
- **localStorage** tracks anonymous user ID through OAuth flow
- **RLS policies** allow access to both anonymous and authenticated carts
- **Merge logic** combines items and handles duplicates
- **Cleanup** removes anonymous cart after successful merge 