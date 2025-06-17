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
        // Get the auth token from Redux state
        const token = getState().auth.token;
        // Update cart data on the server
        const response = await fetch('http://localhost:5001/api/cart', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items })
        });
        if (!response.ok) throw new Error('Failed to update cart');
        return response.json();
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
        setError: (state, action) => {
            state.error = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Cart
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Update Cart
            .addCase(updateCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload || [];
            })
            .addCase(updateCart.rejected, (state, action) => {
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
                state.loading = false;
                state.history = action.payload;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const {
    removeFromCart,
    updateQuantity,
    clearCart,
    setError
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartHistory = (state) => state.cart.history;
export const selectCartTotal = (state) => 
    state.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
export const selectCartItemCount = (state) => 
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer; 