/**
 * Cart Page Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Amazon-style cart page with features:
 * - List of cart items with images and details
 * - Quantity adjustment
 * - Remove items
 * - Price calculations
 * - Checkout button
 * - Empty cart state
 * - Purchase history
 * 
 * Database Integration:
 * - Cart data is loaded from database on component mount
 * - All changes (quantity updates, removals) are synced with database
 * - Purchase history is fetched from database
 * - Checkout process creates order in database
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    selectCartItems, 
    selectCartTotal,
    selectCartHistory,
    removeFromCart, 
    updateQuantity,
    fetchCart,
    updateCart,
    checkout,
    fetchOrders,
    clearCart
} from '../../redux/cartSlice';
import './CartPage.css';

const CartPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const cartItems = useSelector(selectCartItems);
    const total = useSelector(selectCartTotal);
    const history = useSelector(selectCartHistory);
    const [activeTab, setActiveTab] = useState('cart');

    useEffect(() => {
        console.log('CartPage mounted, fetching cart and orders');
        // Load cart and orders from database when component mounts
        dispatch(fetchCart());
        dispatch(fetchOrders());
    }, [dispatch]);

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
        
        // Update local state for immediate UI feedback
        dispatch(updateQuantity({ id: itemId, quantity: newQuantity }));
        
        // Sync the change with the database
        const updatedItems = cartItems.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        dispatch(updateCart(updatedItems));
    };

    const handleRemoveItem = async (itemId) => {
        // Update local state for immediate UI feedback
        dispatch(removeFromCart(itemId));
        
        // Sync the change with the database
        const updatedItems = cartItems.filter(item => item.id !== itemId);
        dispatch(updateCart(updatedItems));
    };

    const handleCheckout = async () => {
        try {
            // Process checkout and create order in database
            await dispatch(checkout()).unwrap();
            alert('Thank you for your purchase!');
            navigate('/');
        } catch (error) {
            alert('Checkout failed. Please try again.');
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
                <button 
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Purchase History
                </button>
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
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="purchase-history">
                    {history.length === 0 ? (
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