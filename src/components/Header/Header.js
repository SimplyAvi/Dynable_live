/**
 * Google Authentication Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Header component with authentication-aware navigation:
 * - Dynamic navigation based on auth state
 * - Welcome message for authenticated users
 * - Login/Signup buttons for guests
 * - Profile access for authenticated users
 * - Dynable logo with home navigation
 * - Cart icon with item count
 */

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../redux/authSlice'
import { clearOrders } from '../../redux/cartSlice'
import './Header.css'

const Header = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated)
    const cartItemCount = useSelector(state => state.cart.items.length)

    const handleLogout = () => {
        // Clear token from localStorage
        localStorage.removeItem('token')
        // Clear auth state from Redux
        dispatch(logout())
        // Clear purchase history from Redux
        dispatch(clearOrders())
        // Navigate to home page
        navigate('/')
    }

    const handleLoginClick = () => {
        // If user is on cart page, redirect back to cart after login
        if (location.pathname === '/cart') {
            localStorage.setItem('postLoginRedirect', '/cart');
        }
        navigate('/login')
    }

    const handleCartClick = () => {
        navigate('/cart')
    }

    return (
        <header className="header">
          <div className="header-inner">
            <div className="header-left">
                <div className="dynable-logo" onClick={() => navigate('/')}>
                    <span className="logo-text">Dynable</span>
                </div>
            </div>
            <div className="header-right">
                <div className="cart-icon" onClick={handleCartClick}>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    {cartItemCount > 0 && (
                        <span className="cart-badge">{cartItemCount}</span>
                    )}
                </div>
                {isAuthenticated ? (
                    <>
                        <button className="nav-button profile" onClick={() => navigate('/profile')}>
                            👤 Profile
                        </button>
                        <button className="nav-button logout" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button className="nav-button" onClick={handleLoginClick}>
                            Login/Signup
                        </button>
                    </>
                )}
            </div>
          </div>
        </header>
    )
}

export default Header