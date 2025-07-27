# Redux Store Structure for Cart System

## Store Configuration

### Root Store (`src/redux/store.js`)
```javascript
import { configureStore } from '@reduxjs/toolkit';
import anonymousCartReducer from './anonymousCartSlice';
import authReducer from './authSlice';
// ... other reducers

export const store = configureStore({
  reducer: {
    anonymousCart: anonymousCartReducer,
    auth: authReducer,
    // ... other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});
```

## Anonymous Cart Slice Structure

### State Shape
```javascript
const initialState = {
  items: [],           // Cart items array
  loading: false,      // Loading state
  error: null,         // Error state
  session: null,       // Current session
  isAnonymous: false,  // Anonymous user flag
  history: [],         // Order history
};
```

### Async Thunks

#### 1. Initialize Authentication
```javascript
export const initializeAuth = createAsyncThunk(
  'anonymousCart/initializeAuth',
  async () => {
    const result = await initializeAnonymousAuth();
    return result;
  }
);
```

#### 2. Fetch Cart
```javascript
export const fetchCart = createAsyncThunk(
  'anonymousCart/fetchCart',
  async () => {
    const items = await getCart();
    return items || [];
  }
);
```

#### 3. Add Item to Cart
```javascript
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
```

#### 4. Merge Anonymous Cart
```javascript
export const mergeAnonymousCartWithServer = createAsyncThunk(
  'anonymousCart/mergeAnonymousCartWithServer',
  async (anonymousUserId, authenticatedUserId) => {
    // Database-only merge logic
    // Returns merged items or error
  }
);
```

### Reducers

#### Extra Reducers
```javascript
extraReducers: (builder) => {
  // Initialize Auth
  builder.addCase(initializeAuth.pending, (state) => {
    state.loading = true;
  });
  builder.addCase(initializeAuth.fulfilled, (state, action) => {
    state.loading = false;
    state.session = action.payload.session;
    state.isAnonymous = action.payload.isAnonymous;
  });
  
  // Fetch Cart
  builder.addCase(fetchCart.fulfilled, (state, action) => {
    state.items = action.payload;
  });
  
  // Add Item
  builder.addCase(addItemToCart.fulfilled, (state, action) => {
    state.items = action.payload;
  });
  
  // Merge Cart
  builder.addCase(mergeAnonymousCartWithServer.fulfilled, (state, action) => {
    if (action.payload.success) {
      state.items = action.payload.mergedItems;
    }
  });
}
```

## Selectors

### Cart Items
```javascript
export const selectCartItems = (state) => state.anonymousCart.items;
```

### Cart Total
```javascript
export const selectCartTotal = (state) => 
  state.anonymousCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
```

### Cart Item Count
```javascript
export const selectCartItemCount = (state) => 
  state.anonymousCart.items.reduce((sum, item) => sum + item.quantity, 0);
```

### Session State
```javascript
export const selectSession = (state) => state.anonymousCart.session;
export const selectIsAnonymous = (state) => state.anonymousCart.isAnonymous;
```

### Loading States
```javascript
export const selectCartLoading = (state) => state.anonymousCart.loading;
export const selectCartError = (state) => state.anonymousCart.error;
```

## State Management Flow

### 1. Anonymous User Flow
```
User visits site → initializeAuth() → create anonymous session → fetchCart() → display empty cart
User adds item → addItemToCart() → save to database → update Redux state → UI updates
```

### 2. Login Flow
```
User clicks login → save cart to database → OAuth redirect → page refresh → mergeAnonymousCartWithServer() → update Redux state
```

### 3. Cart Persistence
```
Redux state ←→ Database (via async thunks)
localStorage ←→ Anonymous user ID tracking
```

## Key Design Principles

### Single Source of Truth
- **Database** is the primary source of truth
- **Redux state** is for UI responsiveness
- **Async thunks** ensure database-first operations

### Session Management
- **Anonymous sessions** are managed by Supabase Auth
- **Session state** is stored in Redux
- **localStorage** tracks anonymous user ID for merging

### Error Handling
- **Async thunks** handle errors gracefully
- **Error state** is stored in Redux
- **UI** can display appropriate error messages 