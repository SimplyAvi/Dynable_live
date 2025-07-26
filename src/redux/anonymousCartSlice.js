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
    mergeAnonymousCartWithStoredId
} from '../utils/anonymousAuth';

console.log('[ANONYMOUS CART] anonymousCartSlice.js loaded');

// Async thunks
export const initializeAuth = createAsyncThunk(
    'anonymousCart/initializeAuth',
    async () => {
        const result = await initializeAnonymousAuth();
        return result;
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
    async (item) => {
        const result = await addToCart(item);
        if (!result.success) {
            throw new Error(result.error);
        }
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
        const result = await clearCart();
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.items;
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
    session: null
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
                console.log('[ANONYMOUS CART] Auth initialized:', action.payload);
            })
            .addCase(initializeAuth.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
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
            })
            .addCase(addItemToCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                console.log('[ANONYMOUS CART] Item added:', action.payload);
            })
            .addCase(addItemToCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
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

export const { clearError, setSession, setCartItems, clearCartState } = anonymousCartSlice.actions;

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