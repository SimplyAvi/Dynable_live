/**
 * Cart Page Implementation
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Updated for Anonymous Auth:
 * - Uses Supabase Carts table for persistence
 * - Anonymous users can add to cart
 * - Automatic cart transfer on login
 * - No localStorage required
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    selectCartItems, 
    selectCartTotal,
    selectCartHistory,
    removeItemFromCart, 
    updateQuantity,
    fetchCart,
    checkout,
    fetchOrders,
    clearCartItems,
    selectIsAnonymous,
    initializeAuth
} from '../../redux/anonymousCartSlice';
import { selectIsAuthenticated } from '../../redux/authSlice';
import './CartPage.css';

const CartPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const cartItems = useSelector(selectCartItems);
    const total = useSelector(selectCartTotal);
    const history = useSelector(selectCartHistory);
    const isAuthenticated = useSelector(state => state.auth?.isAuthenticated || false);
    const isAnonymous = useSelector(selectIsAnonymous);
    const [activeTab, setActiveTab] = useState('cart');

    useEffect(() => {
        // Always fetch cart from Supabase (works for both anonymous and authenticated users)
        console.log('[CART_PAGE] Fetching cart from Supabase');
        
        // If not authenticated, initialize anonymous auth first
        if (!isAuthenticated) {
            console.log('[CART_PAGE] User not authenticated, initializing anonymous auth');
            dispatch(initializeAuth()).then(() => {
                dispatch(fetchCart());
            });
        } else {
            dispatch(fetchCart());
        }
        
        if (isAuthenticated) {
            // Also fetch purchase history for authenticated users
            dispatch(fetchOrders());
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        console.log('Cart items updated:', cartItems);
    }, [cartItems]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        
        try {
            await dispatch(updateQuantity({ itemId, quantity: newQuantity })).unwrap();
            console.log('[CART_PAGE] Quantity updated successfully');
        } catch (error) {
            console.error('[CART_PAGE] Failed to update quantity:', error);
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            await dispatch(removeItemFromCart(itemId)).unwrap();
            console.log('[CART_PAGE] Item removed successfully');
        } catch (error) {
            console.error('[CART_PAGE] Failed to remove item:', error);
        }
    };

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            // Not authenticated: redirect to login
            console.log('[CHECKOUT] User not authenticated, redirecting to login');
            // Store the current location for post-login redirect
            localStorage.setItem('postLoginRedirect', '/cart');
            navigate('/login');
            return;
        }
        
        console.log('[CHECKOUT] Cart items at checkout:', cartItems);
        try {
            // Authenticated user: process checkout
            await dispatch(checkout({
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Anytown',
                    state: 'CA',
                    zipCode: '12345',
                    country: 'USA'
                },
                paymentMethod: 'credit_card'
            })).unwrap();
            
            // Refresh order history after successful checkout
            await dispatch(fetchOrders());
            
            alert('Thank you for your purchase! You can view your order in your purchase history tab below.');
            navigate('/cart');
        } catch (error) {
            console.error('[CHECKOUT] Checkout failed:', error);
            alert('Checkout failed: ' + error.message);
        }
    };

    return (
        <div className="cart-page">
            <div className="cart-tabs">
                <button 
                    className={`tab-button ${activeTab === 'cart' ? 'active' : ''}`}
                    onClick={() => setActiveTab('cart')}
                >
                    Current Cart
                </button>
                {isAuthenticated && (
                    <button 
                        className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Purchase History
                    </button>
                )}
            </div>

            {activeTab === 'cart' ? (
                <div className="cart-container">
                    <div className="cart-items">
                        {cartItems.length === 0 ? (
                            <div className="cart-page empty">
                                <h2>Your cart is empty</h2>
                                <p>Add some items to your cart to see them here.</p>
                                <button 
                                    className="continue-shopping"
                                    onClick={() => navigate('/')}
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        ) : (
                            cartItems.map(item => (
                                <div key={item.id} className="cart-item">
                                    <img src={item.image} alt={item.name} />
                                    <div className="cart-item-details">
                                        <h3>{item.name}</h3>
                                        <p className="item-brand">{item.brand}</p>
                                        <p className="item-price">${item.price.toFixed(2)}</p>
                                        <div className="quantity-controls">
                                            <button 
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button 
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button 
                                            className="remove-item"
                                            onClick={() => handleRemoveItem(item.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {cartItems.length > 0 && (
                        <div className="cart-summary">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <button 
                                className="checkout-button"
                                onClick={handleCheckout}
                                disabled={cartItems.length === 0}
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="purchase-history">
                    {!isAuthenticated ? (
                        <p>Please log in to view your purchase history.</p>
                    ) : history.length === 0 ? (
                        <p>No purchase history available.</p>
                    ) : (
                        history.map((purchase, index) => (
                            <div key={index} className="purchase-card">
                                <div className="purchase-header">
                                    <span>Order Date: {formatDate(purchase.createdAt)}</span>
                                    <span className="purchase-total">
                                        Total: ${Number(purchase.totalAmount).toFixed(2)}
                                    </span>
                                </div>
                                <div className="purchase-items">
                                    {purchase.items.map(item => (
                                        <div key={item.id} className="purchase-item">
                                            <img 
                                                src={item.image} 
                                                alt={item.name} 
                                                className="purchase-item-image"
                                            />
                                            <div className="purchase-item-details">
                                                <h4>{item.name}</h4>
                                                <p className="purchase-item-brand">{item.brand}</p>
                                                <p>Quantity: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CartPage; 