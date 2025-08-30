/**
 * Centralized Authentication Service
 * 
 * This service eliminates the need for getSession() calls by maintaining
 * a single source of truth for auth state and providing reliable methods
 * for all auth operations.
 * 
 * Key Benefits:
 * - No more getSession() calls that can hang
 * - Centralized session state management
 * - Reliable auth state transitions
 * - Consistent error handling
 * - Performance optimization
 */

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
                    
                    console.log('[AUTH SERVICE] User signed in:', {
                        userId: session.user.id,
                        isAnonymous: userIsAnonymous,
                        state: currentAuthState
                    });
                    
                    // 🎯 NEW: Update Redux state when auth changes
                    if (store) {
                        if (userIsAnonymous) {
                                                    // Update anonymous cart state
                        // 🎯 PREVENT DUPLICATE: Check if we already have this session in Redux
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
                            console.log('[AUTH SERVICE] Redux state updated for anonymous session');
                        }
                        } else {
                            // Update authenticated user state
                            const { setCredentials } = await import('../redux/authSlice');
                            store.dispatch(setCredentials({
                                user: session.user,
                                token: session.access_token,
                                isAuthenticated: true
                            }));
                            console.log('[AUTH SERVICE] Redux state updated for authenticated user');
                        }
                    }
                    
                    // 🎯 NEW: Handle authenticated user login flow
                    if (!userIsAnonymous) {
                        console.log('[AUTH SERVICE] Authenticated user login detected');
                        
                        // Check for OAuth callback flow to prevent double merge
                        const isOAuthCallback = window.location.pathname.includes('/auth/callback');
                        const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
                        
                        if (isOAuthCallback && anonymousUserId) {
                            console.log('[AUTH SERVICE] OAuth callback detected, skipping merge (handled by GoogleCallback component)');
                            // Don't perform merge here - GoogleCallback component will handle it
                        } else if (anonymousUserId && anonymousUserId !== session.user.id) {
                            console.log('[AUTH SERVICE] Non-OAuth login detected, merge will be handled by App.js');
                            // Merge will be handled by the existing App.js logic
                        }
                    }
                }
                break;
                
            case 'SIGNED_OUT':
                currentSession = null;
                currentUser = null;
                isAnonymous = false;
                currentAuthState = AuthState.UNKNOWN;
                
                console.log('[AUTH SERVICE] User signed out, state reset');
                
                // 🎯 NEW: Update Redux state when user signs out
                if (store) {
                    const { logout } = await import('../redux/authSlice');
                    store.dispatch(logout());
                    console.log('[AUTH SERVICE] Redux state updated for sign out');
                    
                    // 🎯 CRITICAL: Clear search preferences for fresh anonymous session
                    const { clearSearchPreferencesLocal } = await import('../redux/searchPreferencesSlice');
                    store.dispatch(clearSearchPreferencesLocal());
                    console.log('[AUTH SERVICE] Search preferences cleared for fresh anonymous session');
                    
                    // 🎯 CRITICAL: Clear allergens for fresh anonymous session
                    const { clearAllergies } = await import('../redux/allergiesSlice');
                    store.dispatch(clearAllergies());
                    console.log('[AUTH SERVICE] Allergens cleared for fresh anonymous session');
                    
                    // 🎯 CRITICAL: Create new anonymous session after logout
                    console.log('[AUTH SERVICE] Creating new anonymous session after logout...');
                    const anonymousResult = await createAnonymousSession();
                    
                    if (anonymousResult.success) {
                        // Update Redux with new anonymous session
                        const { initializeAuth } = await import('../redux/anonymousCartSlice');
                        store.dispatch(initializeAuth.fulfilled(anonymousResult, 'anonymousCart/initializeAuth', undefined));
                        console.log('[AUTH SERVICE] ✅ New anonymous session created and Redux updated');
                    } else {
                        console.error('[AUTH SERVICE] ❌ Failed to create anonymous session after logout:', anonymousResult.error);
                    }
                }
                break;
                
            case 'TOKEN_REFRESHED':
                if (session) {
                    currentSession = session;
                    currentUser = session.user;
                    // Keep existing isAnonymous state
                }
                console.log('[AUTH SERVICE] Token refreshed');
                break;
        }
        
        // Notify listeners
        notifyAuthStateListeners();
        
    } catch (error) {
        console.error('[AUTH SERVICE] Error handling auth state change:', error);
        currentAuthState = AuthState.ERROR;
        notifyAuthStateListeners();
    }
};

/**
 * Check initial auth state with timeout protection
 */
const checkInitialAuthState = async (store) => {
    try {
        console.log('[AUTH SERVICE] Checking initial auth state...');
        
        const { data, error } = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Initial session check timeout')), 5000))
        ]);
        
        if (error) {
            console.warn('[AUTH SERVICE] Initial session check failed:', error);
            currentAuthState = AuthState.UNKNOWN;
        } else if (data.session) {
            const userIsAnonymous = isAnonymousUser(data.session);
            currentSession = data.session;
            currentUser = data.session.user;
            isAnonymous = userIsAnonymous;
            currentAuthState = userIsAnonymous ? AuthState.ANONYMOUS : AuthState.AUTHENTICATED;
            
            console.log('[AUTH SERVICE] Initial state set:', {
                userId: data.session.user.id,
                isAnonymous: userIsAnonymous,
                state: currentAuthState
            });
            
            // 🎯 NEW: Update Redux state for initial session
            if (store) {
                if (userIsAnonymous) {
                    // Update anonymous cart state
                    store.dispatch({
                        type: 'anonymousCart/initializeAuth/fulfilled',
                        payload: {
                            session: data.session,
                            isAnonymous: true,
                            success: true
                        }
                    });
                    console.log('[AUTH SERVICE] Redux state updated for initial anonymous session');
                } else {
                    // Update authenticated user state
                    const { setCredentials } = await import('../redux/authSlice');
                    store.dispatch(setCredentials({
                        user: data.session.user,
                        token: data.session.access_token,
                        isAuthenticated: true
                    }));
                    console.log('[AUTH SERVICE] Redux state updated for initial authenticated user');
                }
            }
        } else {
            currentAuthState = AuthState.UNKNOWN;
            console.log('[AUTH SERVICE] No initial session found, creating anonymous session...');
            
            // 🎯 CRITICAL: Create anonymous session when no session exists
            const anonymousResult = await createAnonymousSession();
            
            if (anonymousResult.success) {
                // Update internal state
                currentSession = anonymousResult.session;
                currentUser = anonymousResult.session.user;
                isAnonymous = true;
                currentAuthState = AuthState.ANONYMOUS;
                
                console.log('[AUTH SERVICE] ✅ Anonymous session created on initial load');
                
                // Update Redux state
                if (store) {
                    // 🎯 PREVENT DUPLICATE: Check if we already have this session in Redux
                    const currentState = store.getState();
                    const currentSessionId = currentState.anonymousCart.session?.user?.id;
                    const newSessionId = anonymousResult.session.user.id;
                    
                    if (currentSessionId === newSessionId) {
                        console.log('[AUTH SERVICE] Initial session already exists in Redux, skipping duplicate dispatch');
                    } else {
                        // 🎯 CRITICAL: Clear search preferences for fresh anonymous session
                        const { clearSearchPreferencesLocal } = await import('../redux/searchPreferencesSlice');
                        store.dispatch(clearSearchPreferencesLocal());
                        console.log('[AUTH SERVICE] Search preferences cleared for initial anonymous session');
                        
                        // 🎯 CRITICAL: Clear allergens for fresh anonymous session
                        const { clearAllergies } = await import('../redux/allergiesSlice');
                        store.dispatch(clearAllergies());
                        console.log('[AUTH SERVICE] Allergens cleared for initial anonymous session');
                        
                        store.dispatch({
                            type: 'anonymousCart/initializeAuth/fulfilled',
                            payload: anonymousResult
                        });
                        console.log('[AUTH SERVICE] Redux state updated for initial anonymous session');
                    }
                }
            } else {
                console.error('[AUTH SERVICE] ❌ Failed to create initial anonymous session:', anonymousResult.error);
            }
        }
        
        notifyAuthStateListeners();
        
    } catch (error) {
        console.warn('[AUTH SERVICE] Initial auth state check failed:', error.message);
        currentAuthState = AuthState.UNKNOWN;
        notifyAuthStateListeners();
    }
};

/**
 * Check if user is anonymous
 */
const isAnonymousUser = (session) => {
    if (!session || !session.user) return false;
    
    // Check for explicit anonymous flag
    if (session.user.app_metadata?.is_anonymous === true) {
        return true;
    }
    
    // Check for empty email and phone
    const hasNoEmail = (!session.user.email) || (session.user.email.trim() === '');
    const hasNoPhone = (!session.user.phone) || (session.user.phone.trim() === '');
    
    return hasNoEmail && hasNoPhone;
};

/**
 * Get current auth state (no getSession() call)
 */
export const getAuthState = () => {
    return {
        session: currentSession,
        user: currentUser,
        isAnonymous,
        state: currentAuthState,
        isAuthenticated: currentAuthState === AuthState.AUTHENTICATED,
        hasSession: !!currentSession
    };
};

/**
 * Create anonymous session (no getSession() call)
 */
export const createAnonymousSession = async () => {
    try {
        console.log('[AUTH SERVICE] Creating anonymous session...');
        
        // If we already have an anonymous session, return it
        if (currentAuthState === AuthState.ANONYMOUS && currentSession) {
            console.log('[AUTH SERVICE] Anonymous session already exists, reusing');
            return {
                session: currentSession,
                isAnonymous: true,
                success: true
            };
        }
        
        // Create new anonymous session
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
            console.error('[AUTH SERVICE] Anonymous sign-in failed:', error);
            return {
                session: null,
                isAnonymous: false,
                success: false,
                error: error.message
            };
        }
        
        console.log('[AUTH SERVICE] Anonymous session created successfully:', data.user.id);
        
        // 🎯 FIX: Store anonymous user ID in localStorage for search preferences
        localStorage.setItem('anonymous_user_id', data.user.id);
        console.log('[AUTH SERVICE] ✅ Anonymous user ID stored in localStorage:', data.user.id);
        
        return {
            session: data.session,
            isAnonymous: true,
            success: true
        };
        
    } catch (error) {
        console.error('[AUTH SERVICE] Error creating anonymous session:', error);
        return {
            session: null,
            isAnonymous: false,
            success: false,
            error: error.message
        };
    }
};

/**
 * Sign out user
 */
export const signOutUser = async () => {
    try {
        console.log('[AUTH SERVICE] Signing out user...');
        currentAuthState = AuthState.LOGGING_OUT;
        notifyAuthStateListeners();
        
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('[AUTH SERVICE] Sign out failed:', error);
            currentAuthState = AuthState.ERROR;
            notifyAuthStateListeners();
            return { success: false, error: error.message };
        }
        
        // State will be updated by auth state change listener
        console.log('[AUTH SERVICE] Sign out successful');
        return { success: true };
        
    } catch (error) {
        console.error('[AUTH SERVICE] Error during sign out:', error);
        currentAuthState = AuthState.ERROR;
        notifyAuthStateListeners();
        return { success: false, error: error.message };
    }
};

/**
 * Get current session (no getSession() call)
 */
export const getCurrentSession = () => {
    return currentSession;
};

/**
 * Get current user (no getSession() call)
 */
export const getCurrentUser = () => {
    return currentUser;
};

/**
 * Check if user is anonymous (no getSession() call)
 */
export const isUserAnonymous = () => {
    return isAnonymous;
};

/**
 * Check if user is authenticated (no getSession() call)
 */
export const isUserAuthenticated = () => {
    return currentAuthState === AuthState.AUTHENTICATED;
};

/**
 * Add auth state listener
 */
export const addAuthStateListener = (listener) => {
    authStateListeners.push(listener);
    
    // Immediately call with current state
    listener(getAuthState());
    
    return () => {
        const index = authStateListeners.indexOf(listener);
        if (index > -1) {
            authStateListeners.splice(index, 1);
        }
    };
};

/**
 * Notify all auth state listeners
 */
const notifyAuthStateListeners = () => {
    const authState = getAuthState();
    authStateListeners.forEach(listener => {
        try {
            listener(authState);
        } catch (error) {
            console.error('[AUTH SERVICE] Error in auth state listener:', error);
        }
    });
};

/**
 * Health check for auth service
 */
export const checkAuthServiceHealth = () => {
    return {
        hasSession: !!currentSession,
        hasUser: !!currentUser,
        isAnonymous,
        authState: currentAuthState,
        listenersCount: authStateListeners.length,
        isHealthy: currentAuthState !== AuthState.ERROR
    };
};

// 🎯 EXPORT AUTH STATE CONSTANTS
export { AuthState }; 