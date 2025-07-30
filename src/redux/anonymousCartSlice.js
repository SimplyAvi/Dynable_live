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

console.log('[ANONYMOUS CART] anonymousCartSlice.js loaded');

// Async thunks
export const initializeAuth = createAsyncThunk(
    'anonymousCart/initializeAuth',
    async (force = false, { getState }) => {
        console.log('[ANONYMOUS CART] 🔍 initializeAuth called with force:', force);
        
        // Check if auth is already initialized to prevent multiple calls (unless forced)
        const state = getState();
        console.log('[ANONYMOUS CART] Current state session:', state.anonymousCart.session);
        console.log('[ANONYMOUS CART] Current state isAnonymous:', state.anonymousCart.isAnonymous);
        
        if (state.anonymousCart.session && !force) {
            console.log('[ANONYMOUS CART] Auth already initialized, skipping...');
            return {
                session: state.anonymousCart.session,
                isAnonymous: state.anonymousCart.isAnonymous,
                success: true
            };
        }
        
        // Check for existing Supabase session first (session reuse)
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[ANONYMOUS CART] Supabase session check:', session ? 'found' : 'not found');
        
        if (session) {
            console.log('[ANONYMOUS CART] Existing Supabase session found, using it...');
            const isAnonymous = await isAnonymousUser(session);
            return {
                session,
                isAnonymous,
                success: true
            };
        }
        
        // Rate limiting protection: if we recently failed due to rate limit, wait
        const lastRateLimitError = state.anonymousCart.lastRateLimitError;
        if (lastRateLimitError && Date.now() - lastRateLimitError < 30000) { // 30 seconds
            console.log('[ANONYMOUS CART] Rate limit protection: skipping auth attempt for 30 seconds');
            // Temporarily disable rate limit protection for testing
            console.log('[ANONYMOUS CART] Rate limit protection disabled for testing');
            // return {
            //     session: null,
            //     isAnonymous: false,
            //     success: false,
            //     error: 'Rate limit protection active. Please try again in 30 seconds.'
            // };
        }
        
        // Only create new session if forced or no existing session
        if (force || !session) {
            console.log('[ANONYMOUS CART] Creating new anonymous session...');
            const result = await initializeAnonymousAuth();
            console.log('[ANONYMOUS CART] Auth result:', result);
            return result;
        }
        
        // Fallback: return existing session
        return {
            session: null,
            isAnonymous: false,
            success: false,
            error: 'No session available'
        };
    }
);

export const fetchCart = createAsyncThunk(
    'anonymousCart/fetchCart',
    async () => {
        try {
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
        
        // Ensure auth is initialized before adding to cart
        const state = getState();
        if (!state.anonymousCart.session) {
            console.log('[ANONYMOUS CART] No session found, initializing auth first...');
            
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
        
        // Double-check session exists after auth initialization
        const updatedState = getState();
        if (!updatedState.anonymousCart.session) {
            console.error('[ANONYMOUS CART] ❌ Session still not available after auth initialization');
            throw new Error('Session not available after auth initialization');
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
                return result.items;
            }
            // If no session, just return empty array (logout scenario)
            console.log('[ANONYMOUS CART] No session for cart clear, returning empty array');
            return [];
        } catch (error) {
            console.log('[ANONYMOUS CART] Cart clear failed, returning empty array:', error);
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
    async ({ anonymousUserId, authenticatedUserId }) => {
        try {
            console.log('[ANONYMOUS CART] 🚀 Starting enhanced merge thunk...');
            console.log('[ANONYMOUS CART] Anonymous user ID:', anonymousUserId);
            console.log('[ANONYMOUS CART] Authenticated user ID:', authenticatedUserId);
            
            // 🎯 INPUT VALIDATION
            if (!anonymousUserId || !authenticatedUserId) {
                console.error('[ANONYMOUS CART] ❌ Invalid user IDs provided to merge thunk');
                throw new Error('Invalid user IDs provided');
            }
            
            if (anonymousUserId === authenticatedUserId) {
                console.warn('[ANONYMOUS CART] ⚠️  Cannot merge cart with same user ID');
                throw new Error('Cannot merge cart with same user ID');
            }
            
            // 🎯 USE THE ENHANCED MERGE FUNCTION FROM anonymousAuth.js
            const mergeResult = await mergeAnonymousCartWithStoredId(anonymousUserId, authenticatedUserId);
            
            console.log('[ANONYMOUS CART] Merge result:', mergeResult);
            
            if (!mergeResult.success) {
                console.error('[ANONYMOUS CART] ❌ Merge failed:', mergeResult.error);
                throw new Error(mergeResult.error || 'Merge operation failed');
            }
            
            console.log('[ANONYMOUS CART] ✅ Merge completed successfully');
            console.log('[ANONYMOUS CART] Merged items count:', mergeResult.mergedItems?.length || 0);
            
            // Return the merged items for Redux state update
            return mergeResult.mergedItems || [];
            
        } catch (error) {
            console.error('[ANONYMOUS CART] ❌ Merge thunk failed:', error);
            throw error; // Re-throw to trigger rejected action
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
    lastSessionCheck: null // Timestamp of last session check
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
                state.loading = false;
                state.session = action.payload.session;
                state.isAnonymous = action.payload.isAnonymous;
                
                // Clear rate limit error if auth was successful
                if (action.payload.success) {
                    state.lastRateLimitError = null;
                }
                
                console.log('[ANONYMOUS CART] Auth initialized:', action.payload);
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

export const { clearError, setSession, setCartItems, clearCartState, setSessionCache, clearSessionCache } = anonymousCartSlice.actions;

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