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
 * - Persist cart in localStorage
 */

import { createSlice } from '@reduxjs/toolkit';

// Load cart from localStorage if available
const loadCart = () => {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        return [];
    }
};

const initialState = {
    items: loadCart(),
    loading: false,
    error: null
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const newItem = action.payload;
            const existingItem = state.items.find(item => item.id === newItem.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({ ...newItem, quantity: 1 });
            }
            
            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(state.items));
        },
        removeFromCart: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload);
            localStorage.setItem('cart', JSON.stringify(state.items));
        },
        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            const item = state.items.find(item => item.id === id);
            if (item) {
                item.quantity = quantity;
                localStorage.setItem('cart', JSON.stringify(state.items));
            }
        },
        clearCart: (state) => {
            // TODO: In a real application, this would be called after successful checkout
            // For now, we're just clearing the cart immediately
            state.items = [];
            localStorage.removeItem('cart');
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setError
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => 
    state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
export const selectCartItemCount = (state) =>
    state.cart.items.reduce((count, item) => count + item.quantity, 0);

export default cartSlice.reducer; 