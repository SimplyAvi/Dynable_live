# Database Persistence Strategy

## 1. Cart Data Storage Architecture

### Primary Storage: Supabase Database
```sql
-- Carts table structure
CREATE TABLE "Carts" (
  id SERIAL PRIMARY KEY,
  supabase_user_id UUID NOT NULL, -- Links to auth.users
  items JSONB DEFAULT '[]', -- Cart items as JSON array
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UserId UUID REFERENCES "Users"(id), -- Optional link to Users table
  UNIQUE(supabase_user_id)
);
```

### Cart Items JSONB Structure
```json
{
  "id": "product_id",
  "name": "Product Name",
  "brandName": "Brand Name",
  "price": 15.99,
  "quantity": 2,
  "image": "/path/to/image.png"
}
```

## 2. Database-First Operations

### All Cart Operations Save to Database
```javascript
// anonymousAuth.js - addToCart
export const addToCart = async (item) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { success: false, error: 'No session found' };
  }
  
  // Get current cart items from database
  const currentItems = await getCart();
  
  // Update cart items
  const existingItemIndex = currentItems.findIndex(cartItem => cartItem.id === item.id);
  if (existingItemIndex !== -1) {
    currentItems[existingItemIndex].quantity += item.quantity;
  } else {
    currentItems.push(item);
  }
  
  // Save to database immediately
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

### Database Operations for All Cart Functions
```javascript
// Get cart from database
export const getCart = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return [];
  
  const { data: cart, error } = await supabase
    .from('Carts')
    .select('items')
    .eq('supabase_user_id', session.user.id)
    .maybeSingle();
  
  return cart?.items || [];
};

// Update quantity in database
export const updateCartItemQuantity = async (itemId, quantity) => {
  const currentItems = await getCart();
  const itemIndex = currentItems.findIndex(item => item.id === itemId);
  
  if (quantity <= 0) {
    currentItems.splice(itemIndex, 1);
  } else {
    currentItems[itemIndex].quantity = quantity;
  }
  
  // Save to database
  const { error: upsertError } = await supabase
    .from('Carts')
    .upsert({
      supabase_user_id: session.user.id,
      items: currentItems,
      updatedAt: new Date().toISOString()
    }, { onConflict: 'supabase_user_id' });
  
  return { success: !upsertError, items: currentItems };
};

// Remove item from database
export const removeFromCart = async (itemId) => {
  const currentItems = await getCart();
  const filteredItems = currentItems.filter(item => item.id !== itemId);
  
  // Save to database
  const { error: upsertError } = await supabase
    .from('Carts')
    .upsert({
      supabase_user_id: session.user.id,
      items: filteredItems,
      updatedAt: new Date().toISOString()
    }, { onConflict: 'supabase_user_id' });
  
  return { success: !upsertError, items: filteredItems };
};
```

## 3. Redux State Management

### Redux as Secondary Storage
```javascript
// anonymousCartSlice.js - State structure
const initialState = {
  items: [],           // Cart items (synced from database)
  loading: false,      // Loading state
  error: null,         // Error state
  session: null,       // Current session
  isAnonymous: false,  // Anonymous user flag
  history: [],         // Order history
};
```

### Redux Thunks Sync with Database
```javascript
// Fetch cart from database and update Redux
export const fetchCart = createAsyncThunk(
  'anonymousCart/fetchCart',
  async () => {
    const items = await getCart(); // Database call
    return items || [];
  }
);

// Add item to database and update Redux
export const addItemToCart = createAsyncThunk(
  'anonymousCart/addItemToCart',
  async (item) => {
    const result = await addToCart(item); // Database call
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.items; // Update Redux with database result
  }
);
```

## 4. Persistence Through OAuth Flow

### Cart Persistence Before OAuth
```javascript
// Login.js - Save cart before OAuth redirect
const handleGoogleLogin = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session && isAnonymousUser(session)) {
    const anonymousUserId = session.user.id;
    
    // 🎯 CRITICAL: Save cart to database before OAuth redirect
    if (cartItems && cartItems.length > 0) {
      console.log('[LOGIN] 🚨 CART SAVE BEFORE OAUTH: Saving cart items to database...');
      
      for (const item of cartItems) {
        const saveResult = await addToCart(item);
        console.log('[LOGIN] Save result for item:', saveResult);
      }
      
      // Verify cart was saved
      const { data: savedCart } = await supabase
        .from('Carts')
        .select('items')
        .eq('supabase_user_id', anonymousUserId)
        .maybeSingle();
      
      if (savedCart && savedCart.items && savedCart.items.length > 0) {
        console.log('[LOGIN] ✅ Cart successfully saved to database before OAuth');
      }
    }
    
    // Store anonymous user ID for merge
    localStorage.setItem('anonymousUserIdForMerge', anonymousUserId);
  }
  
  // Proceed with OAuth redirect
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
};
```

### Cart Retrieval After OAuth
```javascript
// GoogleCallback.js - Retrieve cart after OAuth
useEffect(() => {
  const handleAuthCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
      
      if (anonymousUserId) {
        // Get anonymous cart from database
        const { data: anonymousCart } = await supabase
          .from('Carts')
          .select('items')
          .eq('supabase_user_id', anonymousUserId)
          .maybeSingle();
        
        if (anonymousCart && anonymousCart.items && anonymousCart.items.length > 0) {
          console.log('[GOOGLE CALLBACK] Found anonymous cart with items:', anonymousCart.items);
          
          // Perform merge using database data
          await dispatch(mergeAnonymousCartWithServer(anonymousUserId, session.user.id));
        }
        
        localStorage.removeItem('anonymousUserIdForMerge');
      }
      
      navigate('/');
    }
  };
  
  handleAuthCallback();
}, []);
```

## 5. Database vs Redux Persistence

### Database Persistence Benefits
```javascript
// ✅ Survives page refresh
// ✅ Survives OAuth redirect
// ✅ Survives browser restart
// ✅ Survives app restart
// ✅ Available across devices (if user logs in)
// ✅ RLS protected
// ✅ Backup and recovery
```

### Redux Persistence Limitations
```javascript
// ❌ Lost on page refresh
// ❌ Lost on OAuth redirect
// ❌ Lost on browser restart
// ❌ Lost on app restart
// ❌ Not available across devices
// ❌ No backup
// ❌ No RLS protection
```

### Hybrid Approach
```javascript
// Database: Primary source of truth
const cartItems = await getCart(); // Always fresh from database

// Redux: UI responsiveness
dispatch(setCartItems(cartItems)); // Update UI immediately

// Error handling
if (databaseError) {
  // Show error, don't update Redux
  console.error('Database error:', databaseError);
} else {
  // Update Redux with database result
  dispatch(setCartItems(databaseResult));
}
```

## 6. Database Performance

### Indexes for Performance
```sql
-- Primary index on user ID
CREATE INDEX idx_carts_supabase_user_id ON "Carts"(supabase_user_id);

-- Index on creation date for cleanup
CREATE INDEX idx_carts_created_at ON "Carts"(createdAt);

-- Index on updated date for recent activity
CREATE INDEX idx_carts_updated_at ON "Carts"(updatedAt);
```

### Efficient Queries
```javascript
// Single query to get cart with items
const { data: cart } = await supabase
  .from('Carts')
  .select('items')
  .eq('supabase_user_id', session.user.id)
  .maybeSingle();

// Upsert for atomic updates
const { data: upsertData } = await supabase
  .from('Carts')
  .upsert({
    supabase_user_id: session.user.id,
    items: updatedItems,
    updatedAt: new Date().toISOString()
  }, { onConflict: 'supabase_user_id' })
  .select();
```

## 7. Data Consistency

### Transaction-like Operations
```javascript
// Atomic cart update
export const addToCart = async (item) => {
  try {
    // 1. Get current state
    const currentItems = await getCart();
    
    // 2. Update state
    const updatedItems = updateCartItems(currentItems, item);
    
    // 3. Save to database atomically
    const { error } = await supabase
      .from('Carts')
      .upsert({
        supabase_user_id: session.user.id,
        items: updatedItems,
        updatedAt: new Date().toISOString()
      }, { onConflict: 'supabase_user_id' });
    
    // 4. Return success/failure
    return { success: !error, items: updatedItems };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Error Handling
```javascript
// Database-first error handling
const result = await addToCart(item);

if (!result.success) {
  // Database operation failed
  console.error('Failed to save cart:', result.error);
  // Don't update Redux state
  return;
}

// Database operation succeeded
dispatch(setCartItems(result.items)); // Update Redux with database result
```

## 8. Backup and Recovery

### Database Backup
```sql
-- Supabase handles automatic backups
-- Cart data is included in backups
-- Point-in-time recovery available
```

### Data Recovery
```javascript
// Cart data can be recovered from database
const { data: recoveredCart } = await supabase
  .from('Carts')
  .select('*')
  .eq('supabase_user_id', userId)
  .maybeSingle();

if (recoveredCart) {
  // Restore cart from database
  dispatch(setCartItems(recoveredCart.items));
}
```

## 9. Key Design Principles

### Database-First Strategy
- **All cart operations** save to database immediately
- **Redux state** is updated after successful database operations
- **Error handling** prevents inconsistent state
- **Page refresh** restores cart from database

### Persistence Guarantees
- **Cart data survives** OAuth redirects
- **Cart data survives** page refreshes
- **Cart data survives** browser restarts
- **Cart data survives** app restarts
- **Cart data available** across devices after login

### Performance Considerations
- **Efficient queries** with proper indexes
- **Atomic operations** for data consistency
- **Minimal localStorage** usage (only for tracking)
- **Lazy loading** of cart data when needed 