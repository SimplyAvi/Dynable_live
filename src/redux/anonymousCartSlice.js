/**
 * Anonymous Cart Redux Slice
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Simplified Supabase-native cart management:
 * - Uses anonymous auth instead of localStorage
 * - All cart operations go through Supabase
 * - Automatic session management
 * - Simple database-only merge logic
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../utils/supabaseClient';
import { 
    initializeAnonymousAuth,
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    mergeAnonymousCartWithStoredId,
    isAnonymousUser
} from '../utils/anonymousAuth';
import { getAuthState, createAnonymousSession, AuthState } from '../utils/authService';

console.log('[ANONYMOUS CART] anonymousCartSlice.js loaded');

// Async thunks
export const initializeAuth = createAsyncThunk(
    'anonymousCart/initializeAuth',
    async (force = false, { getState }) => {
        console.log('[ANONYMOUS CART] 🔍 initializeAuth called with force:', force);
        
        // 🎯 NEW: Use centralized auth service instead of getSession() calls
        const authState = getAuthState();
        console.log('[ANONYMOUS CART] Current auth state:', authState);
        
        // Check if auth is already initialized to prevent multiple calls (unless forced)
        const state = getState();
        if (state.anonymousCart.session && !force) {
            console.log('[ANONYMOUS CART] Auth already initialized, skipping...');
            return {
                session: state.anonymousCart.session,
                isAnonymous: state.anonymousCart.isAnonymous,
                success: true
            };
        }
        
        // 🎯 SIMPLIFIED: Use auth service to create anonymous session
        console.log('[ANONYMOUS CART] Creating anonymous session via auth service...');
        const result = await createAnonymousSession();
        
        console.log('[ANONYMOUS CART] 🔍 Anonymous session creation result:', result);
        console.log('[ANONYMOUS CART] 🔍 Result structure:', {
            hasSession: !!result.session,
            sessionType: typeof result.session,
            isAnonymous: result.isAnonymous,
            success: result.success
        });
        
        return result;
    }
);

export const fetchCart = createAsyncThunk(
    'anonymousCart/fetchCart',
    async (_, { getState, signal }) => {
        try {
            // 🎯 CRITICAL: Check if we're in logout state
            const state = getState();
            const isLogoutState = state.anonymousCart.items.length === 0 && !state.anonymousCart.isAnonymous;
            const isLoggingOut = state.anonymousCart.isLoggingOut;
            
            // 🎯 ENHANCED: Also check if we just logged out (no session but cart might exist)
            const { data: { session } } = await supabase.auth.getSession();
            const hasNoSession = !session;
            const hasCartItems = state.anonymousCart.items && state.anonymousCart.items.length > 0;
            const isPostLogoutState = hasNoSession && hasCartItems;
            
            if (isLogoutState || isLoggingOut || isPostLogoutState) {
                console.log('[ANONYMOUS CART] 🛡️ Skipping fetchCart - logout state detected (items:', state.anonymousCart.items.length, 'isLoggingOut:', isLoggingOut, 'isPostLogout:', isPostLogoutState, ')');
                console.log('[ANONYMOUS CART] 🔍 Debug - isLogoutState:', isLogoutState, 'isLoggingOut:', isLoggingOut, 'isPostLogout:', isPostLogoutState);
                return [];
            }
            
            // 🎯 CRITICAL: Check if abort signal is triggered (logout in progress)
            if (signal?.aborted) {
                console.log('[ANONYMOUS CART] 🛡️ fetchCart aborted - logout in progress');
                return [];
            }
            
            const items = await getCart();
            return items || [];
        } catch (error) {
            console.error('[ANONYMOUS CART] Error fetching cart:', error);
            return [];
        }
    }
);

export const addItemToCart = createAsyncThunk(
    'anonymousCart/addItemToCart',
    async (item, { dispatch, getState }) => {
        console.log('[ANONYMOUS CART] 🚨 addItemToCart thunk called with item:', item);
        
        // Check if user is authenticated or has a valid session
        const state = getState();
        const isAuthenticated = state.auth.isAuthenticated;
        const hasAnonymousSession = state.anonymousCart.session;
        
        console.log('[ANONYMOUS CART] 🔍 Auth state check - isAuthenticated:', isAuthenticated, 'hasAnonymousSession:', !!hasAnonymousSession);
        
        // If user is authenticated, they should have a valid session from Supabase
        if (isAuthenticated) {
            console.log('[ANONYMOUS CART] ✅ User is authenticated, proceeding with addToCart');
            const result = await addToCart(item);
            console.log('[ANONYMOUS CART] addToCart result:', result);
            
            if (!result.success) {
                console.error('[ANONYMOUS CART] ❌ addToCart failed:', result.error);
                throw new Error(result.error);
            }
            
            console.log('[ANONYMOUS CART] ✅ addToCart successful, returning items:', result.items);
            return result.items;
        }
        
        // If user is not authenticated, ensure anonymous auth is initialized
        if (!hasAnonymousSession) {
            console.log('[ANONYMOUS CART] No anonymous session found, initializing auth first...');
            
            // Retry logic with exponential backoff
            let retryCount = 0;
            const maxRetries = 3;
            let authResult;
            
            while (retryCount < maxRetries) {
                try {
                    authResult = await dispatch(initializeAuth(true)).unwrap();
                    
                    if (authResult.success) {
                        console.log('[ANONYMOUS CART] ✅ Auth initialized successfully, session created');
                        break;
                    } else if (authResult.error && authResult.error.includes('rate limit')) {
                        // Rate limited, wait with exponential backoff
                        const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                        console.log(`[ANONYMOUS CART] Rate limited, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        retryCount++;
                    } else {
                        // Other error, don't retry
                        console.error('[ANONYMOUS CART] ❌ Auth initialization failed:', authResult.error);
                        throw new Error(`Auth initialization failed: ${authResult.error}`);
                    }
                } catch (error) {
                    if (retryCount >= maxRetries - 1) {
                        console.error('[ANONYMOUS CART] ❌ Auth initialization failed after all retries:', error);
                        throw error;
                    }
                    retryCount++;
                }
            }
            
            if (!authResult || !authResult.success) {
                throw new Error('Failed to initialize auth after all retries');
            }
        }
        
        console.log('[ANONYMOUS CART] 🚀 Proceeding with addToCart, session available');
        const result = await addToCart(item);
        console.log('[ANONYMOUS CART] addToCart result:', result);
        
        if (!result.success) {
            console.error('[ANONYMOUS CART] ❌ addToCart failed:', result.error);
            throw new Error(result.error);
        }
        
        console.log('[ANONYMOUS CART] ✅ addToCart successful, returning items:', result.items);
        return result.items;
    }
);

export const updateQuantity = createAsyncThunk(
    'anonymousCart/updateQuantity',
    async ({ itemId, quantity }) => {
        const result = await updateCartItemQuantity(itemId, quantity);
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.items;
    }
);

export const removeItemFromCart = createAsyncThunk(
    'anonymousCart/removeItemFromCart',
    async (itemId) => {
        const result = await removeFromCart(itemId);
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.items;
    }
);

export const clearCartItems = createAsyncThunk(
    'anonymousCart/clearCartItems',
    async () => {
        try {
            // Try to clear cart in database if session exists
            const result = await clearCart();
            if (result.success) {
                console.log('[ANONYMOUS CART] ✅ Cart cleared in database successfully');
                return [];
            }
            // If no session, just return empty array (logout scenario)
            console.log('[ANONYMOUS CART] ⚠️ No session for cart clear, returning empty array');
            return [];
        } catch (error) {
            console.log('[ANONYMOUS CART] ⚠️ Cart clear failed, returning empty array:', error);
            return [];
        }
    }
);

export const checkout = createAsyncThunk(
    'anonymousCart/checkout',
    async (orderData) => {
        const result = await createOrder(orderData);
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.order;
    }
);

// 🎯 ENHANCED MERGE FUNCTION - DATABASE-FIRST APPROACH
export const mergeAnonymousCartWithServer = createAsyncThunk(
    'anonymousCart/mergeAnonymousCartWithServer',
    async ({ anonymousUserId, authenticatedUserId }, { getState, dispatch }) => {
        console.log('🔄 [CART] mergeAnonymousCartWithServer started');
        console.log('🔄 [CART] Anonymous user ID:', anonymousUserId);
        console.log('🔄 [CART] Authenticated user ID:', authenticatedUserId);
        
        try {
            // Log current state before merge
            const currentAnonymousCart = getState().anonymousCart;
            console.log('🔍 [CART] Anonymous cart state before merge:', currentAnonymousCart);
            
            // Import the merge function
            const { mergeAnonymousCartWithStoredId } = await import('../utils/anonymousAuth');
            
            // Perform merge logic
            console.log('🔄 [CART] Calling mergeAnonymousCartWithStoredId function...');
            const result = await mergeAnonymousCartWithStoredId(anonymousUserId, authenticatedUserId);
            console.log('✅ [CART] mergeAnonymousCartWithStoredId function completed:', result);
            
            // Log state after merge
            const stateAfterMerge = getState().anonymousCart;
            console.log('🔍 [CART] Anonymous cart state after merge:', stateAfterMerge);
            
            return result.mergedItems || [];
        } catch (error) {
            console.error('❌ [CART] mergeAnonymousCartWithServer failed:', error);
            console.error('❌ [CART] Error details:', error.message);
            console.error('❌ [CART] Error stack:', error.stack);
            throw error;
        }
    }
);

export const fetchOrders = createAsyncThunk(
    'anonymousCart/fetchOrders',
    async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return [];
            }
            
            const { data: orders, error } = await supabase
                .from('Orders')
                .select('*')
                .eq('supabase_user_id', session.user.id)
                .order('createdAt', { ascending: false });
            
            if (error) {
                console.error('[ANONYMOUS CART] Error fetching orders:', error);
                return [];
            }
            
            return orders || [];
        } catch (error) {
            console.error('[ANONYMOUS CART] Error fetching orders:', error);
            return [];
        }
    }
);

// Initial state
const initialState = {
    items: [],
    history: [],
    loading: false,
    error: null,
    isAnonymous: false,
    session: null,
    lastRateLimitError: null,
    sessionCache: null, // Cache for existing sessions
    lastSessionCheck: null, // Timestamp of last session check
    isLoggingOut: false // 🎯 NEW: Flag to prevent cart operations during logout
};

// Slice
const anonymousCartSlice = createSlice({
    name: 'anonymousCart',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setSession: (state, action) => {
            state.session = action.payload;
            state.isAnonymous = action.payload?.isAnonymous || false;
        },
        setCartItems: (state, action) => {
            state.items = action.payload;
            console.log('[ANONYMOUS CART] Cart items updated:', action.payload);
        },
        clearCartState: (state) => {
            state.items = [];
            state.loading = false;
            state.error = null;
            console.log('[ANONYMOUS CART] Cart cleared');
        },
        setSessionCache: (state, action) => {
            state.sessionCache = action.payload;
            state.lastSessionCheck = Date.now();
            console.log('[ANONYMOUS CART] Session cache updated');
        },
        clearSessionCache: (state) => {
            state.sessionCache = null;
            state.lastSessionCheck = null;
            console.log('[ANONYMOUS CART] Session cache cleared');
        },
        
        // 🎯 NEW: Logout action to clear anonymous cart state
        logout: (state) => {
            console.log('[ANONYMOUS CART] Logout action called, clearing anonymous cart state');
            console.log('[ANONYMOUS CART] 🔍 Cart items before clearing:', state.items.length);
            
            // 🎯 AGGRESSIVE CLEARING: Force clear all cart state
            state.items = [];
            state.history = [];
            state.session = null;
            state.isAnonymous = false;
            state.loading = false;
            state.error = null;
            state.lastRateLimitError = null;
            state.sessionCache = null;
            state.lastSessionCheck = null;
            state.isLoggingOut = true; // 🎯 NEW: Set logout flag
            
            console.log('[ANONYMOUS CART] ✅ Anonymous cart state cleared on logout');
            console.log('[ANONYMOUS CART] 🔍 Cart items after clearing:', state.items.length);
            console.log('[ANONYMOUS CART] 🔍 Full state after clearing:', state);
        },
        
        // 🎯 NEW: Force clear action for immediate clearing
        forceClear: (state) => {
            console.log('[ANONYMOUS CART] Force clear action called');
            state.items = [];
            state.history = [];
            state.session = null;
            state.isAnonymous = false;
            state.loading = false;
            state.error = null;
            state.lastRateLimitError = null;
            state.sessionCache = null;
            state.lastSessionCheck = null;
            state.isLoggingOut = true; // 🎯 NEW: Set logout flag
            console.log('[ANONYMOUS CART] ✅ Force clear completed');
        }
    },
    extraReducers: (builder) => {
        builder
            // Initialize Auth
            .addCase(initializeAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(initializeAuth.fulfilled, (state, action) => {
                console.log('[ANONYMOUS CART] 🔍 initializeAuth.fulfilled reducer called with payload:', action.payload);
                console.log('[ANONYMOUS CART] 🔍 Payload structure:', {
                    hasSession: !!action.payload.session,
                    sessionType: typeof action.payload.session,
                    isAnonymous: action.payload.isAnonymous,
                    success: action.payload.success
                });
                
                state.loading = false;
                state.session = action.payload.session;
                state.isAnonymous = action.payload.isAnonymous;
                state.isLoggingOut = false; // 🎯 NEW: Reset logout flag on successful auth
                
                // Clear rate limit error if auth was successful
                if (action.payload.success) {
                    state.lastRateLimitError = null;
                }
                
                console.log('[ANONYMOUS CART] ✅ Auth initialized, new state:', {
                    session: !!state.session,
                    isAnonymous: state.isAnonymous,
                    success: action.payload.success
                });
            })
            .addCase(initializeAuth.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                
                // Track rate limit errors
                if (action.error.message.includes('rate limit') || action.error.message.includes('429')) {
                    state.lastRateLimitError = Date.now();
                    console.log('[ANONYMOUS CART] Rate limit error tracked, will skip auth for 30 seconds');
                }
            })
            
            // Fetch Cart
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                console.log('[ANONYMOUS CART] Cart fetched:', action.payload);
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Add Item
            .addCase(addItemToCart.pending, (state) => {
                state.loading = true;
                state.error = null;
                console.log('[ANONYMOUS CART] addItemToCart.pending - setting loading to true');
            })
            .addCase(addItemToCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                console.log('[ANONYMOUS CART] ✅ addItemToCart.fulfilled - items updated:', action.payload);
                console.log('[ANONYMOUS CART] ✅ New state items count:', action.payload.length);
                console.log('[ANONYMOUS CART] ✅ Total quantity:', action.payload.reduce((sum, item) => sum + item.quantity, 0));
            })
            .addCase(addItemToCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                console.error('[ANONYMOUS CART] ❌ addItemToCart.rejected:', action.error.message);
            })
            
            // Update Quantity
            .addCase(updateQuantity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateQuantity.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(updateQuantity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Remove Item
            .addCase(removeItemFromCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeItemFromCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(removeItemFromCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Clear Cart
            .addCase(clearCartItems.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(clearCartItems.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(clearCartItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                // 🎯 FIXED: Force clear cart state even if database clear fails
                // This ensures logout always creates clean anonymous state
                state.items = [];
                console.log('[ANONYMOUS CART] 🛡️ Cart state force-cleared after failed database clear');
            })
            
            // Checkout
            .addCase(checkout.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkout.fulfilled, (state, action) => {
                state.loading = false;
                state.items = [];
                state.history.push(action.payload);
            })
            .addCase(checkout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Fetch Orders
            .addCase(fetchOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.history = action.payload;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Merge Cart
            .addCase(mergeAnonymousCartWithServer.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(mergeAnonymousCartWithServer.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.length > 0) { // Check if payload is an array
                    state.items = action.payload;
                    console.log('[ANONYMOUS CART] Cart merge completed:', action.payload.length);
                } else {
                    state.error = 'No items merged or merge failed.';
                }
            })
            .addCase(mergeAnonymousCartWithServer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const { clearError, setSession, setCartItems, clearCartState, setSessionCache, clearSessionCache, logout, forceClear } = anonymousCartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.anonymousCart.items;
export const selectCartTotal = (state) => 
    state.anonymousCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
export const selectCartItemCount = (state) => 
    state.anonymousCart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartHistory = (state) => state.anonymousCart.history || [];
export const selectIsAnonymous = (state) => state.anonymousCart.isAnonymous;
export const selectSession = (state) => state.anonymousCart.session;
export const selectCartLoading = (state) => state.anonymousCart.loading;
export const selectCartError = (state) => state.anonymousCart.error;

export default anonymousCartSlice.reducer; 