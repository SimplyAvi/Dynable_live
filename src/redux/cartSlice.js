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
// Import Supabase anonymous user management
import { 
    getAnonymousCartData, 
    saveAnonymousCartData,
    isCurrentUserAnonymous 
} from '../utils/anonymousUserManager';

console.log('[CARTSLICE] cartSlice.js loaded');

// Async thunks for API calls
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { getState }) => {
        // Get the auth token from Redux state
        const token = getState().auth.token;
        // Fetch cart data from the server
        const response = await fetch('http://localhost:5001/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch cart');
        const items = await response.json();
        return items; // Return items array directly
    }
);

export const updateCart = createAsyncThunk(
    'cart/updateCart',
    async (items, { getState }) => {
        console.log('[UPDATECART] updateCart thunk called with items:', items);
        // Get the auth token from Redux state
        const token = getState().auth.token;
        console.log('[UPDATECART] Using token:', token ? 'Yes' : 'No');
        // Update cart data on the server
        const response = await fetch('http://localhost:5001/api/cart', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items })
        });
        console.log('[UPDATECART] Response status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[UPDATECART] Error response:', errorText);
            throw new Error('Failed to update cart');
        }
        const result = await response.json();
        console.log('[UPDATECART] Success, backend returned:', result);
        return result;
    }
);

export const checkout = createAsyncThunk(
    'cart/checkout',
    async (_, { getState }) => {
        const token = getState().auth.token;
        const response = await fetch('http://localhost:5001/api/cart/checkout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Checkout failed');
        return response.json();
    }
);

export const fetchOrders = createAsyncThunk(
    'cart/fetchOrders',
    async (_, { getState }) => {
        const token = getState().auth.token;
        const response = await fetch('http://localhost:5001/api/cart/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        return response.json();
    }
);

export const addItemToCart = createAsyncThunk(
    'cart/addItemToCart',
    async (item, { getState }) => {
        const token = getState().auth.token;
        const response = await fetch('http://localhost:5001/api/cart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ item })
        });
        if (!response.ok) throw new Error('Failed to add item to cart');
        const items = await response.json();
        return items;
    }
);

// Utility functions for Supabase-enhanced cart persistence
const LOCAL_CART_KEY = 'anonymous_cart';

async function loadLocalCart() {
    try {
        // Check if we have an anonymous Supabase session
        if (isCurrentUserAnonymous()) {
            const cartResult = await getAnonymousCartData();
            if (cartResult.success) {
                return cartResult.cartItems;
            }
        }
        
        // Fallback to localStorage
        const data = localStorage.getItem(LOCAL_CART_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

async function saveLocalCart(items) {
    try {
        // Save to Supabase if we have an anonymous session
        if (isCurrentUserAnonymous()) {
            await saveAnonymousCartData(items);
        } else {
            // Fallback to localStorage
            localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
        }
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
            map.get(item.id).quantity += item.quantity;
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
            const item = state.items.find(item => item.id === id);
            if (item) {
                item.quantity = quantity;
            }
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
        const existing = items.find(i => i.id === item.id);
        if (existing) {
            existing.quantity += item.quantity;
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