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
    selectIsAnonymous,
    initializeAuth
} from '../../redux/anonymousCartSlice';
import { supabase } from '../../utils/supabaseClient';
import { saveCartBeforeAuth } from '../../utils/cartSaveBeforeAuth';
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
        console.log('[CHECKOUT] Starting checkout process...');
        console.log('[CHECKOUT] Is authenticated:', isAuthenticated);
        console.log('[CHECKOUT] Is anonymous:', isAnonymous);
        console.log('[CHECKOUT] Cart items at checkout:', cartItems);

        // Check if user has a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            console.log('[CHECKOUT] No session found, redirecting to login');
            navigate('/login');
            return;
        }

        // Check if user is anonymous - save cart and redirect to login
        if (isAnonymous) {
            console.log('[CHECKOUT] Anonymous user attempting checkout, saving cart before redirect...');
            
            try {
                // 🎯 UNIVERSAL CART SAVE: Use the universal cart save utility
                const cartSaveResult = await saveCartBeforeAuth(cartItems, session.user.id, 'CHECKOUT');
                
                if (!cartSaveResult.success) {
                    console.error('[CHECKOUT] ❌ Cart save failed, aborting login redirect');
                    alert('Failed to save cart items: ' + cartSaveResult.error);
                    return;
                }
                
                console.log('[CHECKOUT] 🚀 Redirecting to login with cart saved...');
                navigate('/login');
                return;
                
            } catch (error) {
                console.error('[CHECKOUT] ❌ Error saving cart before login:', error);
                alert('Failed to save cart before login. Please try again.');
                return;
            }
        }

        // Only authenticated users can checkout
        console.log('[CHECKOUT] Processing checkout for authenticated user');
        
        try {
            await dispatch(checkout({
                items: cartItems,
                totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                status: 'pending',
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Anytown', 
                    state: 'CA',
                    zipCode: '12345',
                    country: 'USA'
                },
                paymentMethod: 'credit_card'
            }));

            // Refresh order history after successful checkout
            await dispatch(fetchOrders());
            
            console.log('[CHECKOUT] Checkout completed successfully');
            alert('Order placed successfully!');
            
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