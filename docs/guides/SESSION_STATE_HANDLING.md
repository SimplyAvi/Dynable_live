# Session and State Handling

## 1. Session Management Strategy

### Supabase Auth Sessions
```javascript
// Supabase handles session persistence automatically
// Sessions are stored in localStorage by Supabase
// Anonymous and authenticated sessions use same mechanism

// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Session structure
{
  user: {
    id: "876a009a-aa2d-4f7f-aa14-71ee4ec91e8a",
    email: null, // Anonymous users have no email
    email_confirmed_at: null, // Anonymous users have no confirmed email
    role: "anonymous", // or "authenticated"
    aud: "authenticated",
    created_at: "2025-07-26T06:24:23.760Z"
  },
  access_token: "eyJhbGciOiJIUzI1NiIsImtpZCI6ImlKUXo5dkRGd2tKdVNNTz...",
  refresh_token: "z3odl7hjlwtj",
  expires_in: 3600,
  expires_at: 1753515830
}
```

### Session Lifecycle Management
```javascript
// App.js - Session initialization
useEffect(() => {
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
  
  checkExistingSession();
}, []);
```

## 2. Redux State Management

### Cart State Structure
```javascript
// anonymousCartSlice.js
const initialState = {
  items: [],           // Cart items from database
  loading: false,      // Loading state for async operations
  error: null,         // Error state
  session: null,       // Current Supabase session
  isAnonymous: false,  // Anonymous user flag
  history: [],         // Order history
};

// Auth state structure
const authInitialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};
```

### State Synchronization
```javascript
// Redux thunks ensure database-first operations
export const addItemToCart = createAsyncThunk(
  'anonymousCart/addItemToCart',
  async (item) => {
    // 1. Save to database
    const result = await addToCart(item);
    
    // 2. Handle errors
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // 3. Return database result to update Redux
    return result.items;
  }
);

// Redux reducer updates state with database result
extraReducers: (builder) => {
  builder.addCase(addItemToCart.fulfilled, (state, action) => {
    state.items = action.payload; // Database result
    state.loading = false;
    state.error = null;
  });
  
  builder.addCase(addItemToCart.rejected, (state, action) => {
    state.loading = false;
    state.error = action.error.message;
    // Don't update items on error
  });
}
```

## 3. localStorage Usage

### Minimal localStorage Strategy
```javascript
// Only store essential tracking data
// Cart data is in database, not localStorage

// Anonymous user ID tracking for merge
localStorage.setItem('anonymousUserIdForMerge', anonymousUserId);
localStorage.removeItem('anonymousUserIdForMerge');

// Post-login redirect tracking
localStorage.setItem('postLoginRedirect', '/checkout');
localStorage.removeItem('postLoginRedirect');

// No cart data in localStorage
// Cart data is always fetched from database
```

### localStorage Cleanup
```javascript
// GoogleCallback.js - Cleanup after successful merge
useEffect(() => {
  const handleAuthCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
      
      if (anonymousUserId) {
        // Perform cart merge
        await dispatch(mergeAnonymousCartWithServer(anonymousUserId, session.user.id));
        
        // Clean up localStorage
        localStorage.removeItem('anonymousUserIdForMerge');
        console.log('[GOOGLE CALLBACK] Cart merge completed, localStorage cleaned');
      }
      
      navigate('/');
    }
  };
  
  handleAuthCallback();
}, []);
```

## 4. Cookie Management

### No Custom Cookies
```javascript
// Supabase handles all cookie management
// No custom cookies needed for cart system
// Session cookies managed by Supabase Auth
// CSRF protection handled by Supabase
```

### Supabase Cookie Strategy
```javascript
// Supabase automatically sets cookies for:
// - Session management
// - CSRF protection
// - Authentication state

// Cookies are secure and httpOnly
// No manual cookie management required
```

## 5. State Persistence Through OAuth

### Pre-OAuth State Preservation
```javascript
// Login.js - Save state before OAuth redirect
const handleGoogleLogin = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session && isAnonymousUser(session)) {
    const anonymousUserId = session.user.id;
    
    // 1. Save cart to database (survives page refresh)
    if (cartItems && cartItems.length > 0) {
      for (const item of cartItems) {
        await addToCart(item);
      }
    }
    
    // 2. Store anonymous user ID in localStorage
    localStorage.setItem('anonymousUserIdForMerge', anonymousUserId);
    
    // 3. Redux state will be lost on page refresh (intentional)
    // Database state will be restored after OAuth
  }
  
  // 4. Proceed with OAuth redirect
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
};
```

### Post-OAuth State Restoration
```javascript
// GoogleCallback.js - Restore state after OAuth
useEffect(() => {
  const handleAuthCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // 1. Get anonymous user ID from localStorage
      const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
      
      if (anonymousUserId) {
        // 2. Retrieve cart from database (not Redux)
        const { data: anonymousCart } = await supabase
          .from('Carts')
          .select('items')
          .eq('supabase_user_id', anonymousUserId)
          .maybeSingle();
        
        if (anonymousCart && anonymousCart.items && anonymousCart.items.length > 0) {
          // 3. Perform merge using database data
          await dispatch(mergeAnonymousCartWithServer(anonymousUserId, session.user.id));
        }
        
        // 4. Clean up localStorage
        localStorage.removeItem('anonymousUserIdForMerge');
      }
      
      // 5. Navigate to home (Redux will be reinitialized)
      navigate('/');
    }
  };
  
  handleAuthCallback();
}, []);
```

## 6. Error Handling and Recovery

### Session Error Recovery
```javascript
// anonymousAuth.js - Session validation
export const addToCart = async (item) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('[ANONYMOUS AUTH] ❌ No session found, cannot add to cart');
      return { success: false, error: 'No session found' };
    }
    
    // Proceed with cart operation
    // ... cart logic ...
    
  } catch (error) {
    console.error('[ANONYMOUS AUTH] ❌ Error in addToCart:', error);
    return { success: false, error: error.message };
  }
};
```

### State Recovery on App Restart
```javascript
// App.js - State recovery
useEffect(() => {
  const initializeApp = async () => {
    try {
      // 1. Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 2. Restore session state
        if (isAnonymousUser(session)) {
          dispatch(initializeAuth());
        } else {
          dispatch(setCredentials({
            user: session.user,
            token: session.access_token,
            isAuthenticated: true
          }));
        }
        
        // 3. Fetch cart from database
        dispatch(fetchCart());
      } else {
        // 4. Create new anonymous session
        dispatch(initializeAuth());
      }
    } catch (error) {
      console.error('[APP] Error initializing app:', error);
      // Handle initialization error
    }
  };
  
  initializeApp();
}, []);
```

## 7. Performance Optimizations

### Lazy Loading
```javascript
// Cart data loaded only when needed
export const fetchCart = createAsyncThunk(
  'anonymousCart/fetchCart',
  async () => {
    const items = await getCart(); // Database call only when needed
    return items || [];
  }
);

// Cart fetched on app initialization
useEffect(() => {
  if (session) {
    dispatch(fetchCart()); // Load cart data
  }
}, [session]);
```

### State Caching
```javascript
// Redux state serves as cache
// Database is source of truth
// Redux provides UI responsiveness

// Cart operations update both database and Redux
const result = await addToCart(item);
if (result.success) {
  dispatch(setCartItems(result.items)); // Update Redux cache
}
```

## 8. Security Considerations

### Session Security
```javascript
// Supabase handles session security
// - Secure cookies
// - CSRF protection
// - Token rotation
// - Session expiration

// No manual session management needed
const { data: { session } } = await supabase.auth.getSession();
```

### Data Isolation
```javascript
// RLS ensures data isolation
// Each user only sees their own cart
const { data: cart } = await supabase
  .from('Carts')
  .select('items')
  .eq('supabase_user_id', session.user.id) // Only own cart
  .maybeSingle();
```

## 9. Key Design Principles

### Database-First State Management
- **Database** is the source of truth
- **Redux** provides UI responsiveness
- **localStorage** only for essential tracking
- **Session** managed by Supabase

### State Persistence Strategy
- **Cart data** persists in database
- **Session data** persists in Supabase
- **Tracking data** persists in localStorage
- **UI state** resets on page refresh (intentional)

### Error Recovery
- **Session errors** trigger re-authentication
- **Database errors** prevent state updates
- **Network errors** show appropriate messages
- **State recovery** from database on restart 