# Anonymous User Tracking System

## 1. Anonymous User Identification

### Anonymous User Detection
```javascript
// anonymousAuth.js
export function isAnonymousUser(session) {
  if (!session || !session.user) {
    return false;
  }
  
  // Check if user has email (authenticated users have email)
  const hasEmail = session.user.email && session.user.email.length > 0;
  
  // Check if user has confirmed email (authenticated users have confirmed email)
  const hasConfirmedEmail = session.user.email_confirmed_at;
  
  // Anonymous users have no email or unconfirmed email
  return !hasEmail || !hasConfirmedEmail;
}
```

### Anonymous Session Characteristics
```javascript
// Anonymous user session example
{
  user: {
    id: "876a009a-aa2d-4f7f-aa14-71ee4ec91e8a", // UUID
    email: null, // No email
    email_confirmed_at: null, // No confirmed email
    role: "anonymous", // Anonymous role
    aud: "authenticated", // Still authenticated in Supabase
    created_at: "2025-07-26T06:24:23.760Z"
  },
  access_token: "eyJhbGciOiJIUzI1NiIsImtpZCI6ImlKUXo5dkRGd2tKdVNNTz...",
  refresh_token: "z3odl7hjlwtj",
  expires_in: 3600,
  expires_at: 1753515830
}
```

## 2. Anonymous User Creation

### Automatic Anonymous Session Creation
```javascript
// anonymousAuth.js - initializeAnonymousAuth
export const initializeAnonymousAuth = async () => {
  try {
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Existing session found
      const isAnonymous = isAnonymousUser(session);
      return {
        session,
        isAnonymous,
        success: true
      };
    }
    
    // Create new anonymous session
    console.log('[ANONYMOUS AUTH] Creating new anonymous session...');
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('[ANONYMOUS AUTH] Anonymous sign-in failed:', error);
      return {
        session: null,
        isAnonymous: false,
        success: false,
        error: error.message
      };
    }
    
    console.log('[ANONYMOUS AUTH] Anonymous session created:', data.user.id);
    return {
      session: data.session,
      isAnonymous: true,
      success: true
    };
  } catch (error) {
    return {
      session: null,
      isAnonymous: false,
      success: false,
      error: error.message
    };
  }
};
```

### Anonymous User Lifecycle
```javascript
// App.js - Session management
const checkExistingSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    if (isAnonymousUser(session)) {
      // Anonymous user - initialize cart
      dispatch(initializeAuth());
      console.log('[APP] Anonymous session found:', session.user.id);
    } else {
      // Authenticated user - set credentials
      dispatch(setCredentials({
        user: session.user,
        token: session.access_token,
        isAuthenticated: true
      }));
      console.log('[APP] Authenticated session found:', session.user.id);
    }
  } else {
    // No session - create anonymous user
    dispatch(initializeAuth());
    console.log('[APP] Creating new anonymous session');
  }
};
```

## 3. Anonymous User ID Storage

### localStorage Tracking
```javascript
// Login.js - Before OAuth redirect
const handleGoogleLogin = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session && isAnonymousUser(session)) {
    const anonymousUserId = session.user.id;
    
    // Store anonymous user ID for cart merge
    localStorage.setItem('anonymousUserIdForMerge', anonymousUserId);
    console.log('[LOGIN] Stored anonymous user ID:', anonymousUserId);
    
    // Save cart to database before OAuth redirect
    if (cartItems && cartItems.length > 0) {
      for (const item of cartItems) {
        await addToCart(item);
      }
    }
  }
  
  // Proceed with OAuth
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
};
```

### Anonymous User ID Retrieval
```javascript
// GoogleCallback.js - After OAuth completion
useEffect(() => {
  const handleAuthCallback = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Get stored anonymous user ID
      const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
      
      if (anonymousUserId) {
        console.log('[GOOGLE CALLBACK] Found anonymous user ID:', anonymousUserId);
        console.log('[GOOGLE CALLBACK] Current authenticated user ID:', session.user.id);
        
        // Perform cart merge
        await dispatch(mergeAnonymousCartWithServer(anonymousUserId, session.user.id));
        
        // Clean up localStorage
        localStorage.removeItem('anonymousUserIdForMerge');
        console.log('[GOOGLE CALLBACK] Cart merge completed');
      }
      
      navigate('/');
    }
  };
  
  handleAuthCallback();
}, []);
```

## 4. Anonymous User Database Storage

### Cart Storage for Anonymous Users
```javascript
// anonymousAuth.js - addToCart
export const addToCart = async (item) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { success: false, error: 'No session found' };
  }
  
  // Anonymous users have session.user.id just like authenticated users
  const userId = session.user.id;
  console.log('[ANONYMOUS AUTH] Adding item for user:', userId);
  console.log('[ANONYMOUS AUTH] Is anonymous user:', isAnonymousUser(session));
  
  // Save to database using same Carts table
  const { data: upsertData, error: upsertError } = await supabase
    .from('Carts')
    .upsert({
      supabase_user_id: userId, // Same field for anonymous and authenticated
      items: currentItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { onConflict: 'supabase_user_id' })
    .select();
  
  return { success: true, items: currentItems };
};
```

### Database Schema for Anonymous Users
```sql
-- Anonymous users are stored in Supabase auth.users table
-- They have the same structure as authenticated users
SELECT * FROM auth.users WHERE email IS NULL;

-- Anonymous carts are stored in Carts table
-- Same structure as authenticated user carts
SELECT * FROM "Carts" WHERE supabase_user_id IN (
  SELECT id FROM auth.users WHERE email IS NULL
);
```

## 5. Anonymous User Session Management

### Session Persistence
```javascript
// Supabase automatically handles session persistence
// Anonymous sessions persist across browser sessions
// Sessions are stored in localStorage by Supabase

// Check session on app startup
const { data: { session } } = await supabase.auth.getSession();

if (session && isAnonymousUser(session)) {
  // Anonymous session exists - restore cart
  dispatch(fetchCart());
} else if (!session) {
  // No session - create new anonymous session
  dispatch(initializeAuth());
}
```

### Session Cleanup
```javascript
// After successful cart merge
export const mergeAnonymousCartWithStoredId = async (anonymousUserId, authenticatedUserId) => {
  // ... merge logic ...
  
  // Delete anonymous cart from database
  const { error: deleteError } = await supabase
    .from('Carts')
    .delete()
    .eq('supabase_user_id', anonymousUserId);
  
  // Note: Anonymous user session remains in auth.users
  // This is intentional - allows for future anonymous sessions
  // Supabase handles session cleanup automatically
};
```

## 6. Anonymous User Security

### RLS Policy Access
```sql
-- Anonymous users have same access as authenticated users
-- RLS policies work the same for both user types
CREATE POLICY "Users can read their own cart" ON "Carts"
FOR SELECT USING (supabase_user_id = auth.uid());
```

### Data Isolation
```javascript
// Each anonymous user has isolated cart data
// No cross-user access allowed by RLS
const { data: cart } = await supabase
  .from('Carts')
  .select('items')
  .eq('supabase_user_id', session.user.id) // Only own cart
  .maybeSingle();
```

## 7. Anonymous User Migration

### Anonymous to Authenticated Flow
```javascript
// 1. Anonymous user adds items to cart
// 2. User clicks login
// 3. Cart saved to database before OAuth
// 4. OAuth redirect (page refresh)
// 5. OAuth callback with authenticated session
// 6. Cart merge using stored anonymous user ID
// 7. Anonymous cart deleted, merged cart saved
// 8. Anonymous session remains in auth.users (for future use)
```

### Key Tracking Points
```javascript
// Anonymous user ID tracking
localStorage.setItem('anonymousUserIdForMerge', anonymousUserId);

// Cart persistence before OAuth
await addToCart(item); // Saves to database

// Cart retrieval after OAuth
const anonymousCart = await supabase
  .from('Carts')
  .select('items')
  .eq('supabase_user_id', anonymousUserId)
  .maybeSingle();

// Cart merge and cleanup
await mergeAnonymousCartWithStoredId(anonymousUserId, authenticatedUserId);
localStorage.removeItem('anonymousUserIdForMerge');
```

## 8. Anonymous User Benefits

### Seamless Experience
- **No registration required** to add items to cart
- **Cart persists** through OAuth flow
- **Automatic merge** when user authenticates
- **No data loss** during login process

### Security Features
- **Isolated cart data** per anonymous user
- **RLS protection** prevents cross-user access
- **Session management** handled by Supabase
- **Clean merge process** with proper cleanup

### Performance Benefits
- **Immediate cart access** without authentication
- **Database persistence** ensures data survival
- **Efficient merge logic** combines carts intelligently
- **Minimal localStorage usage** for tracking only 