# 🛒 CART SYSTEM GUIDE

**Last Updated:** January 2025  
**Status:** ✅ CURRENT - Production Ready

---

## 📋 OVERVIEW

Dynable's cart system supports both **anonymous users** and **authenticated users** with seamless persistence and automatic merging capabilities. The system uses Supabase for data storage with Row Level Security (RLS) protection.

### **Key Features:**
- ✅ Anonymous cart persistence
- ✅ Authenticated cart management
- ✅ Automatic cart merging on login
- ✅ Real-time updates
- ✅ Database persistence
- ✅ RLS security protection

---

## 🏗️ ARCHITECTURE

### **Cart System Components:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redux Store   │    │  Supabase DB    │    │   UI Components │
│                 │    │                 │    │                 │
│ • Cart State    │◄──►│ • Carts Table   │◄──►│ • CartPage      │
│ • Items Array   │    │ • RLS Policies  │    │ • FoodCard      │
│ • Loading State │    │ • Merge Logic   │    │ • Header        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Data Flow:**
1. **Add Item** → Redux State → Database → UI Update
2. **Remove Item** → Redux State → Database → UI Update
3. **Login** → Cart Merge → Combined State → UI Update
4. **Logout** → Clear State → New Anonymous Session

---

## 🗄️ DATABASE SCHEMA

### **Carts Table:**
```sql
CREATE TABLE carts (
  id SERIAL PRIMARY KEY,
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_carts_user_id ON carts(supabase_user_id);
```

### **Cart Items Structure:**
```json
{
  "id": 15042,
  "name": "ORIGINAL KETTLE COOKED POTATO CHIPS",
  "brandName": "MARKET BASKET",
  "price": 0,
  "quantity": 1,
  "image": "product_image_url",
  "category": "Snacks"
}
```

---

## 🔧 IMPLEMENTATION

### **1. Redux State Management**

#### **Anonymous Cart Slice:**
```javascript
// src/redux/anonymousCartSlice.js
const anonymousCartSlice = createSlice({
  name: 'anonymousCart',
  initialState: {
    items: [],
    session: null,
    isAnonymous: false,
    loading: false,
    error: null
  },
  reducers: {
    addItem: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      if (existingItem) {
        existingItem.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
    },
    removeItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload)
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.items.find(item => item.id === id)
      if (item) {
        item.quantity = quantity
      }
    },
    clearCart: (state) => {
      state.items = []
    }
  }
})
```

#### **Cart Actions:**
```javascript
// src/redux/anonymousCartSlice.js
export const addItemToCart = createAsyncThunk(
  'anonymousCart/addItemToCart',
  async (item, { getState, dispatch }) => {
    const state = getState()
    
    // Check if user is authenticated
    if (state.auth.isAuthenticated) {
      // Use authenticated cart logic
      return await addToAuthenticatedCart(item)
    } else {
      // Use anonymous cart logic
      return await addToAnonymousCart(item)
    }
  }
)

export const fetchCart = createAsyncThunk(
  'anonymousCart/fetchCart',
  async (_, { getState }) => {
    const state = getState()
    const session = state.anonymousCart.session
    
    if (!session) {
      throw new Error('No session available')
    }
    
    const { data, error } = await supabase
      .from('carts')
      .select('items')
      .eq('supabase_user_id', session.user.id)
      .single()
    
    if (error) throw error
    return data?.items || []
  }
)
```

### **2. Database Operations**

#### **Add Item to Cart:**
```javascript
// src/utils/anonymousAuth.js
export const addToCart = async (item) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No session available')
  }
  
  // Get current cart
  const { data: currentCart } = await supabase
    .from('carts')
    .select('items')
    .eq('supabase_user_id', session.user.id)
    .single()
  
  let items = currentCart?.items || []
  
  // Check if item already exists
  const existingItemIndex = items.findIndex(cartItem => cartItem.id === item.id)
  
  if (existingItemIndex >= 0) {
    // Update quantity
    items[existingItemIndex].quantity += item.quantity
  } else {
    // Add new item
    items.push(item)
  }
  
  // Upsert cart
  const { data, error } = await supabase
    .from('carts')
    .upsert({
      supabase_user_id: session.user.id,
      items: items,
      updated_at: new Date().toISOString()
    })
  
  if (error) throw error
  return { success: true, items }
}
```

#### **Get Cart Items:**
```javascript
// src/utils/anonymousAuth.js
export const getCart = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { items: [] }
  }
  
  const { data, error } = await supabase
    .from('carts')
    .select('items')
    .eq('supabase_user_id', session.user.id)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    throw error
  }
  
  return { items: data?.items || [] }
}
```

### **3. Cart Merging Logic**

#### **Database Merge Function:**
```sql
-- Merge anonymous cart with authenticated user cart
CREATE OR REPLACE FUNCTION merge_carts(
  anonymous_user_id UUID,
  authenticated_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  anonymous_cart JSONB;
  authenticated_cart JSONB;
  merged_items JSONB;
BEGIN
  -- Get anonymous cart
  SELECT items INTO anonymous_cart
  FROM carts
  WHERE supabase_user_id = anonymous_user_id;
  
  -- Get authenticated cart
  SELECT items INTO authenticated_cart
  FROM carts
  WHERE supabase_user_id = authenticated_user_id;
  
  -- Merge items
  merged_items = COALESCE(authenticated_cart, '[]'::JSONB);
  
  -- Add anonymous items to authenticated cart
  IF anonymous_cart IS NOT NULL THEN
    FOR i IN 0..jsonb_array_length(anonymous_cart) - 1 LOOP
      DECLARE
        anonymous_item JSONB;
        existing_item_index INTEGER;
      BEGIN
        anonymous_item = anonymous_cart->i;
        
        -- Find existing item
        existing_item_index = -1;
        FOR j IN 0..jsonb_array_length(merged_items) - 1 LOOP
          IF (merged_items->j->>'id')::INTEGER = (anonymous_item->>'id')::INTEGER THEN
            existing_item_index = j;
            EXIT;
          END IF;
        END LOOP;
        
        -- Update or add item
        IF existing_item_index >= 0 THEN
          merged_items = jsonb_set(
            merged_items,
            ARRAY[existing_item_index::TEXT, 'quantity'],
            to_jsonb(
              (merged_items->existing_item_index->>'quantity')::INTEGER + 
              (anonymous_item->>'quantity')::INTEGER
            )
          );
        ELSE
          merged_items = merged_items || anonymous_item;
        END IF;
      END;
    END LOOP;
  END IF;
  
  -- Update authenticated cart
  INSERT INTO carts (supabase_user_id, items, updated_at)
  VALUES (authenticated_user_id, merged_items, NOW())
  ON CONFLICT (supabase_user_id)
  DO UPDATE SET
    items = merged_items,
    updated_at = NOW();
  
  -- Delete anonymous cart
  DELETE FROM carts WHERE supabase_user_id = anonymous_user_id;
  
  RETURN merged_items;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 USER FLOWS

### **1. Anonymous User Cart Flow**

#### **Adding Items:**
1. User clicks "Add to Cart" on product
2. `addItemToCart` thunk dispatched
3. Item added to Redux state immediately
4. Item saved to database asynchronously
5. UI updates with new item

#### **Cart Persistence:**
- Cart survives browser refresh
- Cart survives tab closure
- Cart persists until login or browser clear

#### **Cart Management:**
- Update quantities
- Remove items
- Clear entire cart

### **2. Authenticated User Cart Flow**

#### **Login with Existing Cart:**
1. User logs in with Google OAuth
2. Anonymous cart automatically merged
3. Combined cart displayed
4. Anonymous cart deleted from database

#### **Cart Operations:**
- All anonymous cart operations work
- Cart persists across sessions
- Cart accessible from any device

### **3. Cart Merge Process**

#### **Automatic Merge on Login:**
```javascript
// src/components/Auth/GoogleCallback.js
const performCartMerge = async (anonymousUserId, authenticatedUserId) => {
  try {
    const { data, error } = await supabase.rpc('merge_carts', {
      anonymous_user_id: anonymousUserId,
      authenticated_user_id: authenticatedUserId
    })
    
    if (error) throw error
    
    // Update Redux state with merged cart
    dispatch(setCartItems(data))
    
    return { success: true, mergedItems: data }
  } catch (error) {
    console.error('Cart merge failed:', error)
    return { success: false, error }
  }
}
```

---

## 🛡️ SECURITY

### **1. Row Level Security (RLS)**

#### **Cart Table Policies:**
```sql
-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Users can only view their own cart
CREATE POLICY "Users can view own cart" ON carts
  FOR SELECT USING (auth.uid() = supabase_user_id);

-- Users can only insert their own cart
CREATE POLICY "Users can insert own cart" ON carts
  FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);

-- Users can only update their own cart
CREATE POLICY "Users can update own cart" ON carts
  FOR UPDATE USING (auth.uid() = supabase_user_id);

-- Users can only delete their own cart
CREATE POLICY "Users can delete own cart" ON carts
  FOR DELETE USING (auth.uid() = supabase_user_id);
```

### **2. Data Validation**

#### **Cart Item Validation:**
```javascript
// Validate cart item structure
const validateCartItem = (item) => {
  const required = ['id', 'name', 'quantity']
  const missing = required.filter(field => !item[field])
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
  
  if (item.quantity <= 0) {
    throw new Error('Quantity must be greater than 0')
  }
  
  return true
}
```

---

## 🧪 TESTING

### **1. Anonymous Cart Testing**

#### **Test Cart Persistence:**
```javascript
// Add items to cart
await dispatch(addItemToCart(testItem))

// Refresh page
window.location.reload()

// Verify items persist
const state = store.getState()
console.log('Cart items after refresh:', state.anonymousCart.items)
```

#### **Test Cart Operations:**
```javascript
// Test add item
await dispatch(addItemToCart(item1))
expect(store.getState().anonymousCart.items).toContain(item1)

// Test update quantity
await dispatch(updateItemQuantity({ id: item1.id, quantity: 3 }))
expect(store.getState().anonymousCart.items[0].quantity).toBe(3)

// Test remove item
await dispatch(removeItemFromCart(item1.id))
expect(store.getState().anonymousCart.items).not.toContain(item1)
```

### **2. Cart Merge Testing**

#### **Test Merge Functionality:**
```javascript
// Add items as anonymous user
await dispatch(addItemToCart(anonymousItem))

// Login (simulate)
const mergeResult = await performCartMerge(anonymousUserId, authenticatedUserId)
expect(mergeResult.success).toBe(true)
expect(mergeResult.mergedItems).toContain(anonymousItem)
```

---

## 🚨 TROUBLESHOOTING

### **Common Issues:**

#### **1. Cart Not Persisting:**
- Check RLS policies are enabled
- Verify user session exists
- Check database connection
- Review error logs

#### **2. Cart Merge Failing:**
- Verify merge function exists in database
- Check user IDs are correct
- Review merge logic
- Check for database errors

#### **3. Cart State Sync Issues:**
- Check Redux state synchronization
- Verify database operations complete
- Review error handling
- Check network connectivity

#### **4. Performance Issues:**
- Check database indexes
- Review query performance
- Monitor database load
- Consider caching strategies

---

## 📚 RELATED DOCUMENTATION

- [Authentication Guide](./AUTHENTICATION.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Reference](./API_REFERENCE.md)

---

**Status:** ✅ PRODUCTION READY - All systems operational 