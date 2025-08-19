# 🔐 AUTHENTICATION SYSTEM GUIDE

**Last Updated:** January 2025  
**Status:** ✅ CURRENT - Production Ready

---

## 📋 OVERVIEW

Dynable uses **Supabase Auth** with a centralized authentication service that manages both **authenticated users** and **anonymous users**. This system provides seamless cart persistence, allergen preferences, and user data management with a single source of truth for auth state.

### **Key Features:**
- ✅ Centralized auth service with single source of truth
- ✅ Google OAuth integration
- ✅ Anonymous user support with cart persistence
- ✅ Automatic cart merging on login
- ✅ Row Level Security (RLS) policies
- ✅ Session state management
- ✅ Allergen preferences persistence
- ✅ Redux state synchronization

---

## 🏗️ ARCHITECTURE

### **Authentication Flow:**
```
1. User visits site → Auth service initializes
2. Anonymous session created automatically
3. User adds items to cart → Stored in database
4. User logs in → Cart automatically merged
5. User logs out → New anonymous session created
```

### **State Management:**
- **Auth Service:** Single source of truth for auth state
- **Redux Store:** Synchronized with auth service
- **Supabase Auth:** Handles authentication tokens
- **Database:** Stores user data with RLS protection

---

## 🚀 SETUP & CONFIGURATION

### **1. Supabase Configuration**

#### **Environment Variables:**
```javascript
// .env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### **Supabase Client Setup:**
```javascript
// src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### **2. Google OAuth Setup**

#### **Supabase Dashboard Configuration:**
1. Go to Authentication → Providers
2. Enable Google provider
3. Add Google OAuth credentials
4. Configure redirect URLs

#### **Google Cloud Console:**
1. Create OAuth 2.0 credentials
2. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (development)

### **3. Anonymous Auth Setup**

#### **Enable Anonymous Auth:**
```sql
-- In Supabase SQL Editor
-- Anonymous auth is enabled by default
-- No additional setup required
```

---

## 🔧 IMPLEMENTATION

### **1. Centralized Authentication Service**

#### **Auth Service Architecture:**
```javascript
// src/utils/authService.js
import { supabase } from './supabaseClient';

// 🎯 SINGLE SOURCE OF TRUTH: Auth state
let currentSession = null;
let currentUser = null;
let isAnonymous = false;
let authStateListeners = [];

// 🎯 AUTH STATE MACHINE
const AuthState = {
    UNKNOWN: 'unknown',
    AUTHENTICATED: 'authenticated',
    ANONYMOUS: 'anonymous',
    LOGGING_OUT: 'logging_out',
    ERROR: 'error'
};

let currentAuthState = AuthState.UNKNOWN;

/**
 * Initialize auth service and set up listeners
 */
export const initializeAuthService = (store) => {
    console.log('[AUTH SERVICE] Initializing auth service...');
    
    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AUTH SERVICE] Auth state change:', event, session ? 'session exists' : 'no session');
        
        await handleAuthStateChange(event, session, store);
    });
    
    // Initial state check (with timeout protection)
    checkInitialAuthState(store);
};
```

#### **Auth State Management:**
```javascript
/**
 * Handle auth state changes with proper state management
 */
const handleAuthStateChange = async (event, session, store) => {
    try {
        switch (event) {
            case 'SIGNED_IN':
                if (session) {
                    const userIsAnonymous = isAnonymousUser(session);
                    currentSession = session;
                    currentUser = session.user;
                    isAnonymous = userIsAnonymous;
                    currentAuthState = userIsAnonymous ? AuthState.ANONYMOUS : AuthState.AUTHENTICATED;
                    
                    // Update Redux state when auth changes
                    if (store) {
                        if (userIsAnonymous) {
                            // Update anonymous cart state
                            const currentState = store.getState();
                            const currentSessionId = currentState.anonymousCart.session?.user?.id;
                            const newSessionId = session.user.id;
                            
                            if (currentSessionId === newSessionId) {
                                console.log('[AUTH SERVICE] Session already exists in Redux, skipping duplicate dispatch');
                            } else {
                                store.dispatch({
                                    type: 'anonymousCart/initializeAuth/fulfilled',
                                    payload: {
                                        session: session,
                                        isAnonymous: true,
                                        success: true
                                    }
                                });
                            }
                        } else {
                            // Update authenticated user state
                            const { setCredentials } = await import('../redux/authSlice');
                            store.dispatch(setCredentials({
                                user: session.user,
                                token: session.access_token,
                                isAuthenticated: true
                            }));
                        }
                    }
                }
                break;
                
            case 'SIGNED_OUT':
                currentSession = null;
                currentUser = null;
                isAnonymous = false;
                currentAuthState = AuthState.LOGGING_OUT;
                
                // Clear Redux state
                if (store) {
                    const { logout } = await import('../redux/authSlice');
                    const { clearAllergies } = await import('../redux/allergiesSlice');
                    const { clearSearchPreferencesLocal } = await import('../redux/searchPreferencesSlice');
                    
                    store.dispatch(logout());
                    store.dispatch(clearAllergies());
                    store.dispatch(clearSearchPreferencesLocal());
                }
                
                // Create new anonymous session
                await createAnonymousSession(store);
                break;
        }
    } catch (error) {
        console.error('[AUTH SERVICE] Error in handleAuthStateChange:', error);
        currentAuthState = AuthState.ERROR;
    }
};
```

### **2. Anonymous Session Management**

#### **Create Anonymous Session:**
```javascript
/**
 * Create anonymous session with Redux integration
 */
export const createAnonymousSession = async (store) => {
    try {
        console.log('[AUTH SERVICE] Creating anonymous session...');
        
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
            console.error('[AUTH SERVICE] Anonymous sign-in failed:', error);
            throw error;
        }
        
        currentSession = data.session;
        currentUser = data.session.user;
        isAnonymous = true;
        currentAuthState = AuthState.ANONYMOUS;
        
        console.log('[AUTH SERVICE] Anonymous session created:', data.session.user.id);
        
        // Update Redux state
        if (store) {
            store.dispatch({
                type: 'anonymousCart/initializeAuth/fulfilled',
                payload: {
                    session: data.session,
                    isAnonymous: true,
                    success: true
                }
            });
        }
        
        return { session: data.session, error: null };
    } catch (error) {
        console.error('[AUTH SERVICE] createAnonymousSession failed:', error);
        return { session: null, error };
    }
};
```

### **3. Redux State Management**

#### **Auth Slice:**
```javascript
// src/redux/authSlice.js
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
    session: null,
    isTransitioning: false
  },
  reducers: {
    setCredentials: (state, action) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.session = action.payload.session
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.session = null
    }
  }
})
```

---

## 🔄 USER FLOWS

### **1. Anonymous User Flow**

#### **Initial Visit:**
1. User visits site
2. Auth service initializes
3. Anonymous session created automatically
4. Cart initialized as empty
5. User can browse and add items

#### **Adding to Cart:**
1. User clicks "Add to Cart"
2. Item added to Redux state
3. Item saved to database with anonymous user ID
4. UI updates immediately

#### **Cart Persistence:**
- Cart survives browser refresh
- Cart survives tab closure
- Cart persists until user logs in or clears browser

### **2. Authenticated User Flow**

#### **Login Process:**
1. User clicks "Login with Google"
2. Redirected to Google OAuth
3. Google returns user to callback URL
4. Supabase creates authenticated session
5. Cart automatically merged from anonymous session
6. Allergen preferences transferred

#### **Cart Merging:**
```javascript
// Automatic cart merge on login
const performCartMerge = async (anonymousUserId, authenticatedUserId) => {
  const { data, error } = await supabase.rpc('merge_carts', {
    anonymous_user_id: anonymousUserId,
    authenticated_user_id: authenticatedUserId
  })
  return { data, error }
}
```

#### **Logout Process:**
1. User clicks "Logout"
2. Supabase session cleared
3. Redux state reset
4. New anonymous session created
5. Fresh cart initialized

---

## 🛡️ SECURITY

### **1. Row Level Security (RLS)**

#### **Cart Table Policies:**
```sql
-- Users can only access their own cart
CREATE POLICY "Users can view own cart" ON carts
  FOR SELECT USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can insert own cart" ON carts
  FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);

CREATE POLICY "Users can update own cart" ON carts
  FOR UPDATE USING (auth.uid() = supabase_user_id);
```

#### **Search Preferences Policies:**
```sql
-- Users can only access their own preferences
CREATE POLICY "Users can view own preferences" ON search_preferences
  FOR SELECT USING (auth.uid() = supabase_user_id);
```

### **2. Session Management**

#### **Token Refresh:**
- Automatic token refresh handled by Supabase
- Tokens stored securely in browser
- Session persistence across browser restarts

#### **Security Headers:**
```javascript
// Supabase client automatically handles security
// No additional headers required
```

---

## 🧪 TESTING

### **1. Anonymous Auth Testing**

#### **Test Anonymous Session Creation:**
```javascript
// In browser console
const { data, error } = await supabase.auth.signInAnonymously()
console.log('Anonymous session:', data.session)
```

#### **Test Cart Persistence:**
1. Add items to cart as anonymous user
2. Refresh browser
3. Verify cart items persist
4. Check database for anonymous user cart

### **2. Authentication Testing**

#### **Test Google OAuth:**
1. Click "Login with Google"
2. Complete OAuth flow
3. Verify authenticated session
4. Check cart merge functionality

#### **Test Logout:**
1. Logout from authenticated session
2. Verify new anonymous session created
3. Verify cart is empty (fresh start)

---

## 🚨 TROUBLESHOOTING

### **Common Issues:**

#### **1. Cart Not Persisting:**
- Check RLS policies are enabled
- Verify anonymous session exists
- Check database connection

#### **2. Cart Merge Failing:**
- Verify merge function exists in database
- Check user IDs are correct
- Review merge logic

#### **3. Authentication Errors:**
- Verify Google OAuth credentials
- Check redirect URLs
- Review Supabase configuration

#### **4. Session State Issues:**
- Check Redux state synchronization
- Verify auth service is working
- Review auth state listeners

---

## 📚 RELATED DOCUMENTATION

- [Cart System Guide](./CART_SYSTEM.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Reference](./API_REFERENCE.md)

---

**Status:** ✅ PRODUCTION READY - All systems operational 