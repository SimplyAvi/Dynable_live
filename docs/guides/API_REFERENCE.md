# 📚 API REFERENCE

**Last Updated:** January 2025  
**Status:** ✅ CURRENT - Production Ready

---

## 📋 OVERVIEW

This API reference documents all key functions, endpoints, and utilities used in the Dynable application. The app primarily uses Supabase for backend operations with custom Redux actions for state management.

### **Key Components:**
- ✅ Supabase client operations
- ✅ Redux actions and thunks
- ✅ Database functions and procedures
- ✅ Utility functions
- ✅ Authentication operations

---

## 🗄️ SUPABASE OPERATIONS

### **1. Authentication Operations**

#### **Anonymous Authentication:**
```javascript
// src/utils/anonymousAuth.js
export const initializeAnonymousAuth = async () => {
  const { data, error } = await supabase.auth.signInAnonymously()
  return { session: data.session, error }
}

export const isAnonymousUser = async (session) => {
  if (!session) return false
  return session.user.email === null && session.user.aud === 'authenticated'
}
```

#### **Session Management:**
```javascript
// src/utils/authService.js
export const getCurrentSession = () => {
  return supabase.auth.getSession()
}

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}
```

### **2. Cart Operations**

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

#### **Clear Cart:**
```javascript
// src/utils/anonymousAuth.js
export const clearCart = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { success: true }
  }
  
  const { error } = await supabase
    .from('carts')
    .delete()
    .eq('supabase_user_id', session.user.id)
  
  if (error) throw error
  return { success: true }
}
```

### **3. Product Search Operations**

#### **Unified Product Search:**
```javascript
// src/utils/supabaseQueries.js
export const searchProductsUnified = async ({
  searchTerm = '',
  allergens = [],
  page = 1,
  limit = 20,
  userType = 'anonymous'
}) => {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
  
  // Apply search filter
  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`)
  }
  
  // Apply allergen filter
  if (allergens && allergens.length > 0) {
    const mappedAllergens = allergens.map(allergen => 
      allergen.toLowerCase().trim()
    )
    const arrayString = JSON.stringify(mappedAllergens)
    
    query = query.not('allergens', 'cs', arrayString)
  }
  
  // Apply pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)
  
  const { data, error, count } = await query
  
  if (error) throw error
  
  return {
    products: data,
    totalCount: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  }
}
```

#### **Recipe Search:**
```javascript
// src/utils/supabaseQueries.js
export const searchRecipes = async ({
  searchTerm = '',
  page = 1,
  limit = 10
}) => {
  let query = supabase
    .from('recipes')
    .select('*', { count: 'exact' })
  
  if (searchTerm) {
    query = query.ilike('title', `%${searchTerm}%`)
  }
  
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)
  
  const { data, error, count } = await query
  
  if (error) throw error
  
  return {
    recipes: data,
    totalCount: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  }
}
```

### **4. Search Preferences Operations**

#### **Save Search Preferences:**
```javascript
// src/utils/searchPreferences.js
export const saveSearchPreferences = async (preferences) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No session available')
  }
  
  const { data, error } = await supabase
    .from('search_preferences')
    .upsert({
      supabase_user_id: session.user.id,
      search_term: preferences.searchTerm,
      allergens: preferences.allergens,
      updated_at: new Date().toISOString()
    })
  
  if (error) throw error
  return data
}
```

#### **Get Search Preferences:**
```javascript
// src/utils/searchPreferences.js
export const getSearchPreferences = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { searchTerm: '', allergens: [] }
  }
  
  const { data, error } = await supabase
    .from('search_preferences')
    .select('search_term, allergens')
    .eq('supabase_user_id', session.user.id)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    throw error
  }
  
  return {
    searchTerm: data?.search_term || '',
    allergens: data?.allergens || []
  }
}
```

---

## 🔄 REDUX OPERATIONS

### **1. Cart Actions**

#### **Add Item to Cart:**
```javascript
// src/redux/anonymousCartSlice.js
export const addItemToCart = createAsyncThunk(
  'anonymousCart/addItemToCart',
  async (item, { getState, dispatch }) => {
    const state = getState()
    
    // Check if user is authenticated
    if (state.auth.isAuthenticated) {
      return await addToAuthenticatedCart(item)
    } else {
      return await addToAnonymousCart(item)
    }
  }
)
```

#### **Fetch Cart:**
```javascript
// src/redux/anonymousCartSlice.js
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

#### **Clear Cart:**
```javascript
// src/redux/anonymousCartSlice.js
export const clearCart = createAsyncThunk(
  'anonymousCart/clearCart',
  async (_, { getState }) => {
    const state = getState()
    const session = state.anonymousCart.session
    
    if (!session) {
      return { success: true }
    }
    
    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('supabase_user_id', session.user.id)
    
    if (error) throw error
    return { success: true }
  }
)
```

### **2. Authentication Actions**

#### **Initialize Auth:**
```javascript
// src/redux/anonymousCartSlice.js
export const initializeAuth = createAsyncThunk(
  'anonymousCart/initializeAuth',
  async (force = false, { getState }) => {
    const state = getState()
    
    // Check existing session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session && !force) {
      const isAnonymous = await isAnonymousUser(session)
      return { session, isAnonymous, success: true }
    }
    
    // Create new anonymous session
    const { data, error } = await supabase.auth.signInAnonymously()
    
    if (error) throw error
    
    return { session: data.session, isAnonymous: true, success: true }
  }
)
```

### **3. Search Actions**

#### **Search Products:**
```javascript
// src/redux/productsSlice.js
export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (searchParams, { getState }) => {
    const state = getState()
    const { selectedAllergens } = state.searchPreferences
    
    const result = await searchProductsUnified({
      searchTerm: searchParams.searchTerm,
      allergens: selectedAllergens,
      page: searchParams.page || 1,
      limit: searchParams.limit || 20,
      userType: state.auth.isAuthenticated ? 'authenticated' : 'anonymous'
    })
    
    return result
  }
)
```

#### **Search Recipes:**
```javascript
// src/redux/recipesSlice.js
export const searchRecipes = createAsyncThunk(
  'recipes/searchRecipes',
  async (searchParams) => {
    const result = await searchRecipes({
      searchTerm: searchParams.searchTerm,
      page: searchParams.page || 1,
      limit: searchParams.limit || 10
    })
    
    return result
  }
)
```

---

## 🗄️ DATABASE FUNCTIONS

### **1. Cart Merge Function**

#### **Merge Anonymous and Authenticated Carts:**
```sql
-- Database function for merging carts
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

### **2. Search Preferences Merge Function**

#### **Merge Search Preferences:**
```sql
-- Database function for merging search preferences
CREATE OR REPLACE FUNCTION merge_search_preferences(
  anonymous_user_id UUID,
  authenticated_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  anonymous_prefs JSONB;
  authenticated_prefs JSONB;
  merged_allergens JSONB;
BEGIN
  -- Get anonymous preferences
  SELECT allergens INTO anonymous_prefs
  FROM search_preferences
  WHERE supabase_user_id = anonymous_user_id;
  
  -- Get authenticated preferences
  SELECT allergens INTO authenticated_prefs
  FROM search_preferences
  WHERE supabase_user_id = authenticated_user_id;
  
  -- Merge allergens (union of both arrays)
  merged_allergens = COALESCE(authenticated_prefs, '[]'::JSONB);
  
  IF anonymous_prefs IS NOT NULL THEN
    -- Add anonymous allergens to authenticated preferences
    FOR i IN 0..jsonb_array_length(anonymous_prefs) - 1 LOOP
      DECLARE
        allergen TEXT;
        exists BOOLEAN := false;
      BEGIN
        allergen = anonymous_prefs->i;
        
        -- Check if allergen already exists
        FOR j IN 0..jsonb_array_length(merged_allergens) - 1 LOOP
          IF merged_allergens->j = allergen THEN
            exists := true;
            EXIT;
          END IF;
        END LOOP;
        
        -- Add if not exists
        IF NOT exists THEN
          merged_allergens = merged_allergens || allergen;
        END IF;
      END;
    END LOOP;
  END IF;
  
  -- Update authenticated preferences
  INSERT INTO search_preferences (supabase_user_id, allergens, updated_at)
  VALUES (authenticated_user_id, merged_allergens, NOW())
  ON CONFLICT (supabase_user_id)
  DO UPDATE SET
    allergens = merged_allergens,
    updated_at = NOW();
  
  -- Delete anonymous preferences
  DELETE FROM search_preferences WHERE supabase_user_id = anonymous_user_id;
  
  RETURN merged_allergens;
END;
$$ LANGUAGE plpgsql;
```

---

## 🛠️ UTILITY FUNCTIONS

### **1. Allergen Mapping**

#### **Map Allergen Names:**
```javascript
// src/utils/allergenMappings.js
export const mapArrayToCamelCase = (allergens) => {
  if (!Array.isArray(allergens)) return []
  
  return allergens.map(allergen => {
    const normalized = allergen.toLowerCase().trim()
    
    // Map common variations
    const mappings = {
      'tree nuts': 'treenuts',
      'tree nut': 'treenuts',
      'treenuts': 'treenuts',
      'peanut': 'peanuts',
      'peanuts': 'peanuts',
      'milk': 'milk',
      'dairy': 'milk',
      'egg': 'eggs',
      'eggs': 'eggs',
      'fish': 'fish',
      'shellfish': 'shellfish',
      'wheat': 'wheat',
      'gluten': 'gluten',
      'soy': 'soy',
      'soybean': 'soy',
      'sesame': 'sesame',
      'sesame seed': 'sesame'
    }
    
    return mappings[normalized] || normalized
  })
}
```

### **2. Query Utilities**

#### **Resilient Query Wrapper:**
```javascript
// src/utils/supabaseQueries.js
export const resilientSupabaseQuery = async (
  queryFunction,
  queryName = 'unknown',
  options = {}
) => {
  const {
    maxAttempts = 3,
    timeout = 20000,
    retryDelay = 1000
  } = options
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const result = await Promise.race([
        queryFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ])
      
      clearTimeout(timeoutId)
      return result
      
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }
}
```

### **3. Session Utilities**

#### **Get Anonymous User ID:**
```javascript
// src/utils/supabaseClient.js
export const getAnonymousUserIdForMerge = () => {
  const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge')
  return anonymousUserId ? JSON.parse(anonymousUserId) : null
}

export const setAnonymousUserIdForMerge = (userId) => {
  localStorage.setItem('anonymousUserIdForMerge', JSON.stringify(userId))
}

export const clearAnonymousUserIdForMerge = () => {
  localStorage.removeItem('anonymousUserIdForMerge')
}
```

---

## 🔍 ERROR HANDLING

### **1. Common Error Types**

#### **Authentication Errors:**
```javascript
// Handle authentication errors
const handleAuthError = (error) => {
  switch (error.message) {
    case 'No session available':
      return 'Please refresh the page and try again'
    case 'Invalid credentials':
      return 'Invalid login credentials'
    default:
      return 'Authentication error occurred'
  }
}
```

#### **Database Errors:**
```javascript
// Handle database errors
const handleDatabaseError = (error) => {
  switch (error.code) {
    case 'PGRST116':
      return 'No data found'
    case '23505':
      return 'Duplicate entry'
    case '23503':
      return 'Referenced data not found'
    default:
      return 'Database error occurred'
  }
}
```

### **2. Error Recovery**

#### **Retry Logic:**
```javascript
// Retry failed operations
const retryOperation = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      )
    }
  }
}
```

---

## 📊 PERFORMANCE OPTIMIZATION

### **1. Query Optimization**

#### **Use Indexes:**
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_brand ON products(brand_name);
CREATE INDEX idx_carts_user_id ON carts(supabase_user_id);
CREATE INDEX idx_search_preferences_user_id ON search_preferences(supabase_user_id);
```

#### **Limit Results:**
```javascript
// Always use LIMIT for large datasets
const searchProducts = async (searchTerm, limit = 20) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .limit(limit)
  
  return { data, error }
}
```

### **2. Caching Strategy**

#### **Client-Side Caching:**
```javascript
// Cache frequently accessed data
const cache = new Map()

const getCachedData = async (key, fetchFunction) => {
  if (cache.has(key)) {
    return cache.get(key)
  }
  
  const data = await fetchFunction()
  cache.set(key, data)
  
  // Clear cache after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000)
  
  return data
}
```

---

## 📚 RELATED DOCUMENTATION

- [Authentication Guide](./AUTHENTICATION.md)
- [Cart System Guide](./CART_SYSTEM.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Status:** ✅ PRODUCTION READY - All systems operational 