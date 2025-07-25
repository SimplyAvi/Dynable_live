/**
 * Anonymous Cart Redux Slice
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Supabase-native cart management:
 * - Uses anonymous auth instead of localStorage
 * - All cart operations go through Supabase
 * - Automatic session management
 * - No manual merging required
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
    isAnonymousUser
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
        const items = await getCart();
        return items;
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

export const fetchOrders = createAsyncThunk(
    'anonymousCart/fetchOrders',
    async () => {
        // For now, return empty array - we can implement order fetching later
        return [];
    }
);

// Merge anonymous cart with server cart when user logs in
export const mergeAnonymousCartWithServer = createAsyncThunk(
    'anonymousCart/mergeAnonymousCartWithServer',
    async (_, { getState }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) {
                console.log('[CART MERGE] No authenticated user, skipping merge');
                return [];
            }

            console.log('[CART MERGE] Starting cart merge for authenticated user:', user.id);

            // Get the current Redux state to find the anonymous user ID
            const state = getState();
            const anonymousSession = state.anonymousCart.session;
            
            if (!anonymousSession || !anonymousSession.user) {
                console.log('[CART MERGE] No anonymous session found, skipping merge');
                return [];
            }

            const anonymousUserId = anonymousSession.user.id;
            console.log('[CART MERGE] Anonymous user ID:', anonymousUserId);

            // Get anonymous user's cart from database
            const { data: anonymousCart, error: anonymousError } = await supabase
                .from('Carts')
                .select('items')
                .eq('supabase_user_id', anonymousUserId)
                .maybeSingle();

            if (anonymousError) {
                console.error('[CART MERGE] Error fetching anonymous cart:', anonymousError);
                return [];
            }

            const anonymousItems = anonymousCart?.items || [];
            console.log('[CART MERGE] Anonymous cart items:', anonymousItems);

            if (anonymousItems.length === 0) {
                console.log('[CART MERGE] No anonymous cart items to merge');
                return [];
            }

            // Get authenticated user's cart from database
            const { data: authenticatedCart, error: authenticatedError } = await supabase
                .from('Carts')
                .select('items')
                .eq('supabase_user_id', user.id)
                .maybeSingle();

            if (authenticatedError) {
                console.error('[CART MERGE] Error fetching authenticated cart:', authenticatedError);
                return [];
            }

            const authenticatedItems = authenticatedCart?.items || [];
            console.log('[CART MERGE] Authenticated cart items:', authenticatedItems);

            // Merge carts
            const mergedItems = mergeCarts(anonymousItems, authenticatedItems);
            console.log('[CART MERGE] Merged cart items:', mergedItems);

            // Update authenticated user's cart with merged items
            const { error: updateError } = await supabase
                .from('Carts')
                .upsert({
                    supabase_user_id: user.id,
                    items: mergedItems,
                    updatedAt: new Date().toISOString()
                });

            if (updateError) {
                console.error('[CART MERGE] Error updating authenticated cart:', updateError);
                return authenticatedItems; // Keep existing cart if update fails
            }

            // Delete the anonymous user's cart after successful merge
            const { error: deleteError } = await supabase
                .from('Carts')
                .delete()
                .eq('supabase_user_id', anonymousUserId);

            if (deleteError) {
                console.error('[CART MERGE] Error deleting anonymous cart:', deleteError);
                // Don't fail the merge if delete fails
            }

            console.log('[CART MERGE] Successfully merged carts and deleted anonymous cart');
            return mergedItems;

        } catch (error) {
            console.error('[CART MERGE] Merge operation failed:', error);
            return [];
        }
    }
);

// Utility function to merge two cart arrays
function mergeCarts(localItems, serverItems) {
    const merged = [...serverItems];
    
    localItems.forEach(localItem => {
        const existingIndex = merged.findIndex(item => item.id === localItem.id);
        
        if (existingIndex >= 0) {
            // Item exists, add quantities
            merged[existingIndex] = {
                ...merged[existingIndex],
                quantity: merged[existingIndex].quantity + localItem.quantity
            };
        } else {
            // New item, add to cart
            merged.push(localItem);
        }
    });
    
    return merged;
}

const initialState = {
    items: [],
    loading: false,
    error: null,
    isAnonymous: false,
    session: null
};

const anonymousCartSlice = createSlice({
    name: 'anonymousCart',
    initialState,
    reducers: {
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Initialize Auth
            .addCase(initializeAuth.pending, (state) => {
                state.loading = true;
            })
            .addCase(initializeAuth.fulfilled, (state, action) => {
                state.loading = false;
                state.session = action.payload.session;
                state.isAnonymous = action.payload.isAnonymous;
                console.log('[ANONYMOUS CART] Auth initialized:', {
                    userId: action.payload.session?.user?.id,
                    isAnonymous: action.payload.isAnonymous
                });
            })
            .addCase(initializeAuth.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Fetch Cart
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
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
            })
            .addCase(updateQuantity.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                console.log('[ANONYMOUS CART] Quantity updated:', action.payload);
            })
            .addCase(updateQuantity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Remove Item
            .addCase(removeItemFromCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(removeItemFromCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                console.log('[ANONYMOUS CART] Item removed:', action.payload);
            })
            .addCase(removeItemFromCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Clear Cart
            .addCase(clearCartItems.pending, (state) => {
                state.loading = true;
            })
            .addCase(clearCartItems.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                console.log('[ANONYMOUS CART] Cart cleared');
            })
            .addCase(clearCartItems.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Checkout
            .addCase(checkout.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkout.fulfilled, (state, action) => {
                state.loading = false;
                state.items = []; // Clear cart after successful checkout
                console.log('[ANONYMOUS CART] Checkout successful:', action.payload);
            })
            .addCase(checkout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            
            // Fetch Orders
            .addCase(fetchOrders.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.history = action.payload;
                console.log('[ANONYMOUS CART] Orders fetched:', action.payload);
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

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

export const { setError, clearError } = anonymousCartSlice.actions;

export default anonymousCartSlice.reducer; 