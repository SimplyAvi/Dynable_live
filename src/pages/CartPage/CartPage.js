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
 */

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    selectCartItems, 
    selectCartTotal, 
    removeFromCart, 
    updateQuantity,
    clearCart 
} from '../../redux/cartSlice';
import './CartPage.css';

const CartPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const cartItems = useSelector(selectCartItems);
    const total = useSelector(selectCartTotal);

    const handleQuantityChange = (id, newQuantity) => {
        if (newQuantity > 0) {
            dispatch(updateQuantity({ id, quantity: newQuantity }));
        }
    };

    const handleRemoveItem = (id) => {
        dispatch(removeFromCart(id));
    };

    const handleCheckout = () => {
        // TODO: In a real application, this would integrate with a payment system
        // For now, we're just clearing the cart
        dispatch(clearCart());
        alert('Thank you for your purchase! This is a temporary checkout process.');
        navigate('/');
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-page empty">
                <h2>Your Cart is Empty</h2>
                <p>Add items to your cart to see them here.</p>
                <button 
                    className="continue-shopping"
                    onClick={() => navigate('/')}
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <h1>Shopping Cart</h1>
            <div className="cart-container">
                <div className="cart-items">
                    {cartItems.map((item) => (
                        <div key={item.id} className="cart-item">
                            <img 
                                src={item.image} 
                                alt={item.name} 
                                className="item-image"
                            />
                            <div className="item-details">
                                <h3>{item.name}</h3>
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
                            <div className="item-total">
                                ${(item.price * item.quantity).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="cart-summary">
                    <h3>Order Summary</h3>
                    <div className="summary-row">
                        <span>Subtotal ({cartItems.length} items):</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Shipping:</span>
                        <span>Free</span>
                    </div>
                    <div className="summary-row total">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <button 
                        className="checkout-button"
                        onClick={handleCheckout}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage; 