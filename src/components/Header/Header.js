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
import { clearSearchPreferencesLocal, selectSelectedAllergens } from '../../redux/searchPreferencesSlice'
import { clearAllergies } from '../../redux/allergiesSlice'
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
                console.error('[HEADER] Supabase sign out error:', error);
            } else {
                console.log('[HEADER] Supabase sign out successful');
            }
            
            // 🎯 CRITICAL: Force session refresh to clear any cached session
            try {
                await supabase.auth.refreshSession();
                console.log('[HEADER] ✅ Session refresh completed');
            } catch (refreshError) {
                console.warn('[HEADER] Session refresh failed:', refreshError);
            }
            
            // 🎯 CRITICAL: Verify session is cleared
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.warn('[HEADER] ⚠️ Session still exists after signOut, forcing additional cleanup...');
                // Force another sign out
                await supabase.auth.signOut();
            } else {
                console.log('[HEADER] ✅ Session successfully cleared');
            }
            
            // Clear token from localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('anonymous_user_id')
            localStorage.removeItem('anonymous_cart')
            localStorage.removeItem('postLoginRedirect')
            localStorage.removeItem('anonymousUserIdForMerge')
            console.log('[HEADER] localStorage cleared');
            
                    // 🎯 CRITICAL: Also clear cart from database to prevent re-fetching
        try {
            // Use the auth service instead of direct import
            const { getCurrentSession } = await import('../utils/authService');
            const session = getCurrentSession();
            
            if (session) {
                const { clearCart } = await import('../utils/anonymousAuth');
                const clearResult = await clearCart();
                console.log('[HEADER] Database cart clear result:', clearResult);
            } else {
                console.log('[HEADER] No session to clear cart for');
            }
        } catch (error) {
            console.warn('[HEADER] Failed to clear database cart:', error);
        }
        
        // 🎯 CRITICAL: Abort any ongoing cart fetches
        try {
            const state = store.getState();
            const ongoingFetches = state.anonymousCart.loading;
            
            if (ongoingFetches) {
                console.log('[HEADER] Aborting ongoing cart fetches...');
                // Cancel any pending fetchCart operations
                store.dispatch({ type: 'anonymousCart/fetchCart/pending' });
            }
        } catch (error) {
            console.warn('[HEADER] Failed to abort cart fetches:', error);
        }
            
            // Clear all Redux state
            console.log('[HEADER] Dispatching logout action...');
            dispatch(logout())
            console.log('[HEADER] Logout action dispatched');
            
            // 🎯 VERIFY: Check cart state after clearing
            setTimeout(() => {
                const currentCartState = window.store.getState().anonymousCart;
                console.log('[HEADER] 🔍 Cart state after clearing:', currentCartState);
                console.log('[HEADER] 🔍 Cart items count after clearing:', currentCartState.items.length);
            }, 100);
            
            console.log('[HEADER] Cart cleared from Redux');
            
            // 🎯 CRITICAL: Clear search preferences for fresh anonymous session
            // Anonymous sessions should start with no search preferences
            dispatch(clearSearchPreferencesLocal());
            console.log('[HEADER] Search preferences cleared for fresh anonymous session');
            
            // 🎯 CRITICAL: Clear allergen toggles for fresh anonymous session
            // Anonymous sessions should start with no allergens selected
            dispatch(clearAllergies());
            console.log('[HEADER] Allergen toggles cleared for fresh anonymous session');
            
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
            // 🎯 CRITICAL: Clear allergens even on error for fresh anonymous session
            dispatch(clearAllergies());
            navigate('/')
        }
    }

    const handleLoginClick = async () => {
        console.log('[HEADER LOGIN] 🔍 Starting header login process...');
        
        try {
            // Check if user has a session
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                console.log('[HEADER LOGIN] No session found, redirecting to login');
                // If user is on cart page, redirect back to cart after login
                if (location.pathname === '/cart') {
                    localStorage.setItem('postLoginRedirect', '/cart');
                }
                navigate('/login');
                return;
            }

            // Check if user is anonymous - save cart and allergens before redirect
            const isAnonymous = !session.user.email;
            
            if (isAnonymous) {
                console.log('[HEADER LOGIN] Anonymous user attempting login, saving cart and allergens before redirect...');
                
                // Get current cart and allergen state from component state
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