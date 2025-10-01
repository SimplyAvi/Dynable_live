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
import { clearCartItems, selectCartItemCount, clearCartState, selectCartItems, logout as logoutAnonymousCart } from '../../redux/anonymousCartSlice'
import { clearSearchPreferencesLocal, selectSelectedAllergens, setSearchTerm, setSelectedAllergens } from '../../redux/searchPreferencesSlice'
import { setSearchbarValue } from '../../redux/searchbarSlice'
import { clearAllergies } from '../../redux/allergiesSlice'
import { clearProducts } from '../../redux/productSlice'
import { clearRecipes } from '../../redux/recipeSlice'
import { clearSearchPreferencesOnLogout } from '../../utils/searchPreferencesManager'
import { saveCartBeforeAuth } from '../../utils/cartSaveBeforeAuth'
import { saveSearchPreferencesBeforeAuthAsync } from '../../redux/searchPreferencesSlice'
import { supabase } from '../../utils/supabaseClient'
import './Header.css'

const Header = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const isAuthenticated = useSelector(state => state.auth?.isAuthenticated || false)
    const cartItemCount = useSelector(selectCartItemCount)
    const currentUser = useSelector(state => state.auth?.user)
    const cartItems = useSelector(selectCartItems)
    const selectedAllergens = useSelector(selectSelectedAllergens)

    // 🛡️ FIXED: Logo click handler to act like back button (preserve state)
    const handleLogoClick = () => {
        console.log('[HEADER] Logo clicked - navigating to home (preserving state)');
        
        // 🚀 NEW BEHAVIOR: Just navigate to home, don't clear anything
        // This acts like a "back" button that preserves user's current search and allergens
        navigate('/');
        
        console.log('[HEADER] ✅ Navigated to home, state preserved');
    };

    const handleLogout = async () => {
        try {
            console.log('[HEADER] Logging out user...');
            console.log('[HEADER] Current auth state before logout:', isAuthenticated);
            
            // 🎯 PHASE 1: IMMEDIATE DATA CLEARING for better UX
            console.log('[HEADER] 🚫 Immediately clearing products and recipes for instant feedback');
            dispatch(clearProducts());
            dispatch(clearRecipes());
            
            // Clear search preferences from database if user is authenticated
            if (isAuthenticated && currentUser?.id) {
                try {
                    await clearSearchPreferencesOnLogout(currentUser.id);
                    console.log('[HEADER] ✅ Search preferences cleared from database');
                } catch (error) {
                    console.error('[HEADER] ❌ Failed to clear search preferences from database:', error);
                }
            }
            
            // 🎯 CRITICAL FIX: Force complete session reset
            console.log('[HEADER] 🔄 Starting complete session reset...');
            
            // First, clear Redux state immediately to prevent cart operations
            dispatch({ type: 'anonymousCart/forceClear' });
            dispatch({ type: 'anonymousCart/logout' });
            
            // Force immediate state update with store
            const store = window.store;
            store.dispatch({ type: 'anonymousCart/forceClear' });
            store.dispatch({ type: 'anonymousCart/logout' });
            
            // Sign out from Supabase
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('[HEADER] ❌ Supabase sign out failed:', error);
            } else {
                console.log('[HEADER] ✅ Supabase sign out successful');
            }
            
            // Clear localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('anonymous_user_id')
            localStorage.removeItem('anonymous_cart')
            localStorage.removeItem('postLoginRedirect')
            localStorage.removeItem('anonymousUserIdForMerge')
            
            // 🎯 FIXED: Batch all logout clears together to prevent flickering
            console.log('[HEADER] Clearing all Redux state in batch...');
            
            // Clear all Redux state in one batch
            dispatch(logout())
            dispatch(clearCartItems())
            dispatch(clearCartState())
            dispatch(logoutAnonymousCart())
            dispatch(setSearchTerm(''))
            dispatch(setSearchbarValue(''))
            dispatch(setSelectedAllergens([]))
            dispatch(clearSearchPreferencesLocal())
            dispatch(clearAllergies())
            
            console.log('[HEADER] ✅ All Redux state cleared in batch');
            
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
            dispatch(logoutAnonymousCart())
            // 🛡️ ADDED: Clear search states even on error
            dispatch(setSearchTerm(''));
            dispatch(setSearchbarValue(''));
            dispatch(setSelectedAllergens([]));
            // 🎯 CRITICAL: Clear allergens even on error for fresh anonymous session
            dispatch(clearAllergies());
            navigate('/')
        }
    }

    const handleLoginClick = async () => {
        try {
            console.log('[HEADER LOGIN] Starting login process...');
            
            // Check if user is anonymous and has cart items to save
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session && (cartItems.length > 0 || selectedAllergens.length > 0)) {
                console.log('[HEADER LOGIN] ✅ User is anonymous, saving state before login...');
                
                const allergens = selectedAllergens; // selectedAllergens is already an array of strings
                
                console.log('[HEADER LOGIN] Current cart items:', cartItems);
                console.log('[HEADER LOGIN] Current allergens:', allergens);
                
                try {
                    // 🎯 SAVE CART BEFORE AUTH (same as checkout)
                    const cartSaveResult = await saveCartBeforeAuth(cartItems, session.user.id, 'HEADER_LOGIN');
                    
                    if (!cartSaveResult.success) {
                        console.error('[HEADER LOGIN] ❌ Cart save failed, proceeding without save');
                        // Don't abort login for cart save failure
                    } else {
                        console.log('[HEADER LOGIN] ✅ Cart saved successfully');
                    }
                    
                    // 🎯 SAVE ALLERGENS BEFORE AUTH (same as checkout)
                    if (allergens.length > 0) {
                        console.log('[HEADER LOGIN] 💾 Saving allergens before auth...');
                        const searchPrefsResult = await dispatch(saveSearchPreferencesBeforeAuthAsync({
                            searchTerm: '',
                            allergens,
                            anonymousUserId: session.user.id
                        })).unwrap();
                        
                        if (!searchPrefsResult.success) {
                            console.warn('[HEADER LOGIN] ⚠️ Allergen save failed:', searchPrefsResult.error);
                        } else {
                            console.log('[HEADER LOGIN] ✅ Allergens saved successfully');
                        }
                    }
                    
                    // 🛡️ STORE ANONYMOUS USER ID FOR MERGE (same as checkout)
                    console.log('[HEADER LOGIN] Storing anonymous user ID for merge:', session.user.id);
                    localStorage.setItem('anonymousUserIdForMerge', session.user.id);
                    
                } catch (error) {
                    console.error('[HEADER LOGIN] ❌ Error saving state before login:', error);
                    // Don't abort login for save failure
                }
            }
            
            // If user is on cart page, redirect back to cart after login
            if (location.pathname === '/cart') {
                localStorage.setItem('postLoginRedirect', '/cart');
            }
            
            console.log('[HEADER LOGIN] 🚀 Redirecting to login...');
            navigate('/login');
            
        } catch (error) {
            console.error('[HEADER LOGIN] ❌ Error in header login process:', error);
            // Fallback to simple navigation
            if (location.pathname === '/cart') {
                localStorage.setItem('postLoginRedirect', '/cart');
            }
            navigate('/login');
        }
    }

    const handleCartClick = () => {
        navigate('/cart')
    }

    return (
        <header className="header">
          <div className="header-inner">
            <div className="header-left">
                <div className="dynable-logo" onClick={handleLogoClick}>
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
                    <button className="nav-button profile" onClick={() => navigate('/profile')}>
                        👤 Profile
                    </button>
                ) : (
                    <button className="nav-button" onClick={handleLoginClick}>
                        Login
                    </button>
                )}
            </div>
          </div>
        </header>
    )
}

export default Header