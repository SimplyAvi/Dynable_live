/**
 * Cart Management Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Redux slice for managing shopping cart:
 * - Add/remove items
 * - Update quantities
 * - Calculate totals
 * - Clear cart after checkout
 * - Persist cart in database per user
 * - Track purchase history
 * 
 * Database Synchronization:
 * - Cart state is synced with the database on every change
 * - Changes are persisted per user using JWT authentication
 * - Cart data is loaded from database when user logs in
 * - Real-time updates between local state and database
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../utils/supabaseClient';

console.log('[CARTSLICE] cartSlice.js loaded');

// Async thunks for API calls
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { getState }) => {
        try {
            // Get the current user from Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('[CART] No user logged in, cannot fetch cart');
                return [];
            }

            if (!user.email) {
                console.log('[CART] User has no email, cannot fetch cart');
                return [];
            }

            console.log('[CART] Fetching cart for user:', user.id, 'email:', user.email);

            // Get current cart data from server
            const { data: userData, error } = await supabase
                .from('Users')
                .select('*')
                .eq('email', user.email)
                .single();

            if (error) {
                console.error('[CART] Error fetching user data:', error);
                // If user doesn't exist in Users table, create them
                if (error.code === 'PGRST116') {
                    console.log('[CART] User not found in Users table, creating user...');
                    const { data: newUser, error: createError } = await supabase
                        .from('Users')
                        .insert({
                            supabase_user_id: user.id, // Use Supabase UUID for secure RLS
                            email: user.email,
                            name: user.user_metadata?.name || '',
                            role: 'end_user',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('[CART] Error creating user:', createError);
                        return [];
                    }

                    console.log('[CART] Created new user:', newUser);
                    return [];
                }
                return [];
            }

            // Extract cart data from anonymous_cart_data JSONB column
            const serverCartItems = userData.anonymous_cart_data || [];
            console.log('[CART] Fetched cart items:', serverCartItems);

            // Check if there are pending anonymous cart items to merge
            const pendingMerge = localStorage.getItem('pendingCartMerge');
            if (pendingMerge) {
                const anonymousCartItems = JSON.parse(pendingMerge);
                console.log('[CART] Merging anonymous cart items:', anonymousCartItems);
                
                // Merge carts
                const mergedItems = mergeCarts(anonymousCartItems, serverCartItems);
                console.log('[CART] Merged cart items:', mergedItems);
                
                // Update server with merged cart
                const { error: updateError } = await supabase
                    .from('Users')
                    .update({ anonymous_cart_data: mergedItems })
                    .eq('email', user.email);

                if (updateError) {
                    console.error('[CART] Error updating merged cart:', updateError);
                } else {
                    console.log('[CART] Successfully updated merged cart on server');
                }
                
                // Clear pending merge
                localStorage.removeItem('pendingCartMerge');
                localStorage.removeItem('anonymousCart');
                
                return mergedItems;
            }

            return serverCartItems;
        } catch (error) {
            console.error('[CART] Failed to fetch cart:', error);
            return [];
        }
    }
);

export const updateCart = createAsyncThunk(
    'cart/updateCart',
    async (items, { getState }) => {
        console.log('[UPDATECART] updateCart thunk called with items:', items);
        
        try {
            // Get the current user from Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('[CART] No user logged in, cannot update cart');
                throw new Error('User not authenticated');
            }

            if (!user.email) {
                console.log('[CART] User has no email, cannot update cart');
                throw new Error('User email not available');
            }

            console.log('[CART] Updating cart for user:', user.id, 'email:', user.email);

            // Update the anonymous_cart_data column in Users table
            const { data, error } = await supabase
                .from('Users')
                .update({ anonymous_cart_data: items })
                .eq('email', user.email)
                .select();

            if (error) {
                console.error('[CART] Error updating cart:', error);
            throw new Error('Failed to update cart');
            }

            console.log('[CART] Successfully updated cart:', data);
            return items; // Return the items array directly
        } catch (error) {
            console.error('[CART] Failed to update cart:', error);
            throw error;
        }
    }
);

export const checkout = createAsyncThunk(
    'cart/checkout',
    async (_, { getState }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            if (!user.email) {
                throw new Error('User email not available');
            }

            // Get current cart data and user ID
            const { data: userData, error: fetchError } = await supabase
                .from('Users')
                .select('*')
                .eq('email', user.email)
                .single();

            if (fetchError) {
                console.error('[CHECKOUT] Error fetching user data:', fetchError);
                throw new Error('Failed to fetch user data for checkout');
            }

            const cartItems = userData.anonymous_cart_data || [];

            if (cartItems && cartItems.length > 0) {
                // Calculate total amount
                const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                
                console.log('[CHECKOUT] Creating order with:', {
                    supabase_user_id: user.id,
                    userId: userData.id, // Integer ID from Users table
                    items_count: cartItems.length,
                    totalAmount: totalAmount,
                    cartItems: cartItems
                });

                // Create order in Orders table with ALL required fields including userId
                const { data: order, error: orderError } = await supabase
                    .from('Orders')
                    .insert({
                        supabase_user_id: user.id, // Use UUID column
                        userId: userData.id, // Use integer ID from Users table
                        items: cartItems, // Store cart items in JSONB
                        totalAmount: totalAmount,
                        status: 'pending',
                        shippingAddress: {
                            street: '123 Main St',
                            city: 'Anytown',
                            state: 'CA',
                            zipCode: '12345',
                            country: 'USA'
                        },
                        paymentMethod: 'credit_card',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (orderError) {
                    console.error('[CHECKOUT] Supabase order insert error:', orderError);
                    console.error('[CHECKOUT] Error details:', {
                        code: orderError.code,
                        message: orderError.message,
                        details: orderError.details,
                        hint: orderError.hint
                    });
                    throw new Error(`Failed to create order: ${orderError.message}`);
                }

                console.log('[CHECKOUT] Order created successfully:', order);

                // Clear cart by setting anonymous_cart_data to empty array
                const { error: clearError } = await supabase
                    .from('Users')
                    .update({ anonymous_cart_data: [] })
                    .eq('email', user.email);

                if (clearError) {
                    console.error('[CHECKOUT] Error clearing cart:', clearError);
                    // Don't throw here, order was created successfully
                } else {
                    console.log('[CHECKOUT] Cart cleared successfully');
                }

                return order;
            }

            throw new Error('Cart is empty');
        } catch (error) {
            console.error('[CART] Checkout failed:', error);
            throw error;
        }
    }
);

export const fetchOrders = createAsyncThunk(
    'cart/fetchOrders',
    async (_, { getState }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return [];
            }

            if (!user.email) {
                console.log('[CART] User has no email, cannot fetch orders');
                return [];
            }

            const { data, error } = await supabase
                .from('Orders')
                .select('*')
                .eq('supabase_user_id', user.id) // Use Supabase UUID as identifier
                .order('createdAt', { ascending: false });

            if (error) {
                console.error('[CART] Error fetching orders:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('[CART] Failed to fetch orders:', error);
            return [];
        }
    }
);

export const addItemToCart = createAsyncThunk(
    'cart/addItemToCart',
    async (item, { getState }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            if (!user.email) {
                throw new Error('User email not available');
            }

            // Get current cart data
            const { data: userData, error: fetchError } = await supabase
                .from('Users')
                .select('*')
                .eq('email', user.email)
                .single();

            if (fetchError) {
                // If user doesn't exist, create them
                if (fetchError.code === 'PGRST116') {
                    const { data: newUser, error: createError } = await supabase
                        .from('Users')
                        .insert({
                            supabase_user_id: user.id, // Use Supabase UUID for secure RLS
                            email: user.email,
                            name: user.user_metadata?.name || '',
                            role: 'end_user',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            anonymous_cart_data: [{
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image: item.image,
                                quantity: 1
                            }]
                        })
                        .select()
                        .single();

                    if (createError) {
                        throw new Error('Failed to create user');
                    }

                    return newUser.anonymous_cart_data || [];
                }
                throw new Error('Failed to fetch user data');
            }

            const currentCart = userData.anonymous_cart_data || [];

            // Check if item already exists in cart
            const existingItemIndex = currentCart.findIndex(cartItem => cartItem.id === item.id);

            let updatedCart;
            if (existingItemIndex !== -1) {
                // Update quantity by creating a new array
                updatedCart = currentCart.map((cartItem, index) => 
                    index === existingItemIndex 
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            } else {
                // Add new item by creating a new array
                updatedCart = [...currentCart, {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    quantity: 1
                }];
            }

            // Update cart in database
            const { data, error } = await supabase
                .from('Users')
                .update({ anonymous_cart_data: updatedCart })
                .eq('email', user.email)
                .select();

            if (error) throw new Error('Failed to update cart');
            return updatedCart;
        } catch (error) {
            console.error('[CART] Failed to add item to cart:', error);
            throw error;
        }
    }
);

// Enhanced cart merging with better error handling and atomic operations
export const mergeAnonymousCartWithServer = createAsyncThunk(
    'cart/mergeAnonymousCartWithServer',
    async (_, { getState }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) {
                console.log('[CART MERGE] No authenticated user, skipping merge');
                return [];
            }

            // Get anonymous cart from localStorage (check both keys)
            const anonymousCart = JSON.parse(localStorage.getItem('anonymousCart') || '[]');
            const pendingCartMerge = JSON.parse(localStorage.getItem('pendingCartMerge') || '[]');
            
            // Use whichever has items
            const cartItemsToMerge = anonymousCart.length > 0 ? anonymousCart : pendingCartMerge;
            
            if (cartItemsToMerge.length === 0) {
                console.log('[CART MERGE] No cart items to merge');
                return [];
            }

            console.log('[CART MERGE] Starting merge with cart items:', cartItemsToMerge);
            console.log('[CART MERGE] Source:', anonymousCart.length > 0 ? 'anonymousCart' : 'pendingCartMerge');

            // If we're using anonymousCart, store it in pendingCartMerge for fetchCart to find
            if (anonymousCart.length > 0 && pendingCartMerge.length === 0) {
                localStorage.setItem('pendingCartMerge', JSON.stringify(anonymousCart));
            }

            // Get server cart in one atomic operation
            const { data: userData, error: fetchError } = await supabase
                .from('Users')
                .select('anonymous_cart_data')
                .eq('email', user.email)
                .single();

            if (fetchError) {
                console.error('[CART MERGE] Error fetching server cart:', fetchError);
                // Keep cart items if server fetch fails
                return cartItemsToMerge;
            }

            const serverCart = userData.anonymous_cart_data || [];
            console.log('[CART MERGE] Server cart items:', serverCart);

            // Merge carts
            const mergedCart = mergeCarts(cartItemsToMerge, serverCart);
            console.log('[CART MERGE] Merged cart items:', mergedCart);

            // Update server with merged cart
            const { error: updateError } = await supabase
                .from('Users')
                .update({ anonymous_cart_data: mergedCart })
                .eq('email', user.email);

            if (updateError) {
                console.error('[CART MERGE] Error updating server cart:', updateError);
                // Keep cart items if update fails
                return cartItemsToMerge;
            }

            // Clear both localStorage keys after successful server update
            localStorage.removeItem('anonymousCart');
            localStorage.removeItem('pendingCartMerge');
            console.log('[CART MERGE] Successfully merged and cleared cart items');

            return mergedCart;
        } catch (error) {
            console.error('[CART MERGE] Merge operation failed:', error);
            // Keep cart items on any error
            const anonymousCart = JSON.parse(localStorage.getItem('anonymousCart') || '[]');
            const pendingCartMerge = JSON.parse(localStorage.getItem('pendingCartMerge') || '[]');
            return anonymousCart.length > 0 ? anonymousCart : pendingCartMerge;
        }
    }
);

// Utility functions for Supabase-enhanced cart persistence
const LOCAL_CART_KEY = 'anonymous_cart';

async function loadLocalCart() {
    try {
        // Load cart items from localStorage for anonymous users
        const items = JSON.parse(localStorage.getItem('anonymousCart') || '[]');
        console.log('[CARTSLICE] Loaded cart items from localStorage:', items);
        return items;
    } catch (error) {
        console.error('[CARTSLICE] Failed to load cart data:', error);
        return [];
    }
}

async function saveLocalCart(items) {
    try {
        // Save cart items to localStorage for anonymous users
        localStorage.setItem('anonymousCart', JSON.stringify(items));
        console.log('[CARTSLICE] Saved cart items to localStorage:', items);
        return;
    } catch (error) {
        console.error('[CARTSLICE] Failed to save cart data:', error);
    }
}

// Note: clearLocalCart function removed as it's not used in the current implementation

// Helper to merge two carts (by item id, summing quantities)
export function mergeCarts(localItems, serverItems) {
    const map = new Map();
    serverItems.forEach(item => map.set(item.id, { ...item }));
    localItems.forEach(item => {
        if (map.has(item.id)) {
            // Create a new object instead of modifying the existing one
            const existingItem = map.get(item.id);
            map.set(item.id, {
                ...existingItem,
                quantity: existingItem.quantity + item.quantity
            });
        } else {
            map.set(item.id, { ...item });
        }
    });
    return Array.from(map.values());
}

const initialState = {
    items: [],
    history: [],
    loading: false,
    error: null
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        removeFromCart: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload);
        },
        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            state.items = state.items.map(item => 
                item.id === id ? { ...item, quantity } : item
            );
        },
        clearCart: (state) => {
            state.items = [];
        },
        clearOrders: (state) => {
            state.history = [];
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        // New: initialize cart from Supabase/localStorage for anonymous users
        initializeAnonymousCart: (state, action) => {
            // This will be handled by the async thunk below
            state.loading = true;
        },
        // New: handle itemsUpdated for anonymous cart actions
        itemsUpdated: (state, action) => {
            state.items = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Cart
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                console.log('[CARTSLICE] fetchCart.fulfilled case running! payload:', action.payload);
                console.log('[CARTSLICE] Setting Redux cart to:', action.payload || []);
                state.loading = false;
                state.items = action.payload || [];
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Update Cart
            .addCase(updateCart.pending, (state) => {
                console.log('[CARTSLICE] updateCart.pending case running!');
                state.loading = true;
            })
            .addCase(updateCart.fulfilled, (state, action) => {
                console.log('[CARTSLICE] updateCart.fulfilled case running! payload:', action.payload);
                console.log('[CARTSLICE] Setting Redux cart to:', action.payload || []);
                console.log('[CARTSLICE] Previous state items:', state.items);
                state.loading = false;
                state.items = action.payload || [];
                console.log('[CARTSLICE] New state items:', state.items);
            })
            .addCase(updateCart.rejected, (state, action) => {
                console.log('[CARTSLICE] updateCart.rejected case running! error:', action.error);
                state.loading = false;
                state.error = action.error.message;
            })
            // Add to Cart
            .addCase(addItemToCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(addItemToCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
            })
            .addCase(addItemToCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Merge Anonymous Cart
            .addCase(mergeAnonymousCartWithServer.pending, (state) => {
                state.loading = true;
            })
            .addCase(mergeAnonymousCartWithServer.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
                console.log('[CARTSLICE] Merge completed, cart items:', action.payload);
            })
            .addCase(mergeAnonymousCartWithServer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Checkout
            .addCase(checkout.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkout.fulfilled, (state, action) => {
                console.log('[CARTSLICE] checkout.fulfilled case running! payload:', action.payload);
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
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                console.log('[CARTSLICE] fetchOrders.fulfilled case running! payload:', action.payload);
                state.loading = false;
                state.history = action.payload;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Anonymous cart initialization
            .addCase(initializeAnonymousCartAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(initializeAnonymousCartAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(initializeAnonymousCartAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

// Async thunk for initializing anonymous cart
export const initializeAnonymousCartAsync = createAsyncThunk(
    'cart/initializeAnonymousCart',
    async () => {
        const items = await loadLocalCart();
        return items;
    }
);

// Middleware-like thunk for anonymous cart actions
export const addToCartAnonymous = (item) => async (dispatch, getState) => {
    const { isAuthenticated } = getState().auth;
    if (!isAuthenticated) {
        const items = [...getState().cart.items];
        const existingIndex = items.findIndex(i => i.id === item.id);
        if (existingIndex !== -1) {
            // Create a new object instead of modifying the existing one
            items[existingIndex] = { ...items[existingIndex], quantity: items[existingIndex].quantity + item.quantity };
        } else {
            items.push({ ...item });
        }
        await saveLocalCart(items);
        dispatch(itemsUpdated(items));
    }
};

export const removeFromCartAnonymous = (id) => async (dispatch, getState) => {
    const { isAuthenticated } = getState().auth;
    if (!isAuthenticated) {
        const items = getState().cart.items.filter(item => item.id !== id);
        await saveLocalCart(items);
        dispatch(itemsUpdated(items));
    }
};

export const updateQuantityAnonymous = (id, quantity) => async (dispatch, getState) => {
    const { isAuthenticated } = getState().auth;
    if (!isAuthenticated) {
        const items = getState().cart.items.map(item =>
            item.id === id ? { ...item, quantity } : item
        );
        await saveLocalCart(items);
        dispatch(itemsUpdated(items));
    }
};

export const {
    removeFromCart,
    updateQuantity,
    clearCart,
    clearOrders,
    setError,
    initializeAnonymousCart,
    itemsUpdated
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartHistory = (state) => state.cart.history;
export const selectCartTotal = (state) => 
    state.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
export const selectCartItemCount = (state) => 
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer; 