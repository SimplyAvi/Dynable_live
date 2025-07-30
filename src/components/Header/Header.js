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
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/authSlice'
import { clearCartItems, selectCartItemCount, clearCartState } from '../../redux/anonymousCartSlice'
import { clearSearchPreferencesLocal } from '../../redux/searchPreferencesSlice'
import { clearAllergies } from '../../redux/allergiesSlice'
import { clearSearchPreferencesOnLogout } from '../../utils/searchPreferencesManager'
import { supabase } from '../../utils/supabaseClient'
import './Header.css'

const Header = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const isAuthenticated = useSelector(state => state.auth?.isAuthenticated || false)
    const cartItemCount = useSelector(selectCartItemCount)
    const currentUser = useSelector(state => state.auth?.user)

    const handleLogout = async () => {
        try {
            console.log('[HEADER] Logging out user...');
            console.log('[HEADER] Current auth state before logout:', isAuthenticated);
            
            // Clear search preferences from database if user is authenticated
            if (isAuthenticated && currentUser?.id) {
                try {
                    await clearSearchPreferencesOnLogout(currentUser.id);
                    console.log('[HEADER] ✅ Search preferences cleared from database');
                } catch (error) {
                    console.error('[HEADER] ❌ Failed to clear search preferences from database:', error);
                }
            }
            
            // Sign out from Supabase first
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('[HEADER] Supabase sign out error:', error);
            } else {
                console.log('[HEADER] Supabase sign out successful');
            }
            
            // Clear token from localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('anonymous_user_id')
            localStorage.removeItem('anonymous_cart')
            localStorage.removeItem('postLoginRedirect')
            localStorage.removeItem('anonymousUserIdForMerge')
            console.log('[HEADER] localStorage cleared');
            
            // Clear all Redux state
            console.log('[HEADER] Dispatching logout action...');
            dispatch(logout())
            console.log('[HEADER] Logout action dispatched');
            
            // Clear cart from Redux immediately for UI update
            dispatch(clearCartItems())
            // Also directly clear the Redux state for immediate UI update
            dispatch(clearCartState())
            console.log('[HEADER] Cart cleared from Redux');
            
            // Clear search preferences from Redux
            dispatch(clearSearchPreferencesLocal())
            console.log('[HEADER] Search preferences cleared from Redux');
            
            // Clear allergen toggles from Redux
            dispatch(clearAllergies())
            console.log('[HEADER] Allergen toggles cleared from Redux');
            
            // Navigate to home page
            navigate('/')
            
            console.log('[HEADER] Logout completed successfully');
        } catch (error) {
            console.error('[HEADER] Logout error:', error);
            // Still clear everything even if Supabase sign out fails
            localStorage.removeItem('token')
            localStorage.removeItem('anonymous_user_id')
            localStorage.removeItem('anonymous_cart')
            localStorage.removeItem('postLoginRedirect')
            localStorage.removeItem('anonymousUserIdForMerge')
            dispatch(logout())
            dispatch(clearCartItems())
            dispatch(clearCartState())
            dispatch(clearSearchPreferencesLocal())
            dispatch(clearAllergies())
            navigate('/')
        }
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