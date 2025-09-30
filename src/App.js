/**
 * Main Application Component
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Updated for Anonymous Auth:
 * - Uses signInAnonymously() for unauthenticated users
 * - Cart persistence in Supabase Carts table
 * - Automatic cart transfer on login
 * - No localStorage required
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import Header from './components/Header/Header';
import Homepage from './pages/Homepage/Homepage';
import AboutUsPage from './pages/AboutUsPage/AboutUsPage';
import ProductPage from './pages/ProductPage/ProductPage';
import RecipePage from './pages/RecipePage/RecipePage';
import CategoryPage from './pages/Catagory_Testing/CatagoryPage';
import CartPage from './pages/CartPage/CartPage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Auth/Profile';
import GoogleCallback from './components/Auth/GoogleCallback';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { fetchAllergensPure } from './redux/allergiesSlice';
import { initializeAuth, fetchCart } from './redux/anonymousCartSlice';
import { setCredentials } from './redux/authSlice';
import { loadSearchPreferencesAsync } from './redux/searchPreferencesSlice';
import { clearSearchPreferencesLocal, setSearchTerm, setSelectedAllergens } from './redux/searchPreferencesSlice';
import { setSearchbarValue } from './redux/searchbarSlice';
import { clearAllergies } from './redux/allergiesSlice';
import { supabase } from './utils/supabaseClient';
import { isAnonymousUser } from './utils/anonymousAuth';
import { initializeAuthService } from './utils/authService';
import { setupPerformanceMonitoring } from './utils/performanceMonitor';
import { clearProducts } from './redux/productSlice'; // 🎯 NEW: Import product clearing
import store from './redux/store'; // Fix: use default import
import { logAuthEvent, logMergeAttempt, logMergeResult } from './utils/debugLogger';
import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // ✅ ADDED: Initialize performance monitoring
    setupPerformanceMonitoring();
    
    // 🎯 NEW: Initialize centralized auth service with store access
    initializeAuthService(store);
    
    // Fetch allergens from Supabase database on app start
    dispatch(fetchAllergensPure());
  }, [dispatch]);

  // 🛡️ ADDED: Page refresh handler to reset search state
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Store a flag indicating this is a page refresh
      sessionStorage.setItem('isPageRefresh', 'true');
    };

    const handleLoad = () => {
      // Check if this is a page refresh
      const isRefresh = sessionStorage.getItem('isPageRefresh');
      
      if (isRefresh === 'true') {
        console.log('[APP] Page refresh detected - resetting search state');
        
        // Clear search state (both searchTerm and searchbarValue)
        dispatch(setSearchTerm(''));
        dispatch(setSearchbarValue(''));
        dispatch(setSelectedAllergens([]));
        dispatch(clearAllergies());
        dispatch(clearProducts());
        
        // Clear the flag
        sessionStorage.removeItem('isPageRefresh');
        
        console.log('[APP] ✅ Search state reset after page refresh');
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, [dispatch]);

  useEffect(() => {
    // Check for existing session first
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Only initialize anonymous auth if no session exists
        dispatch(initializeAuth()).then((result) => {
          if (result.meta.requestStatus === 'fulfilled') {
            // 🚀 OPTIMIZATION: Only fetch cart if not already fetched
            const currentCartState = window.store?.getState()?.anonymousCart;
            if (!currentCartState?.items || currentCartState.items.length === 0) {
              console.log('[APP] Fetching cart after auth initialization');
              dispatch(fetchCart());
            } else {
              console.log('[APP] Cart already loaded, skipping fetch');
            }
          } else {
            console.error('[APP] Failed to initialize anonymous auth:', result.error);
          }
        });
      } else {
        // Check if this is an anonymous session using improved detection
        const isAnonymous = await isAnonymousUser(session);
        
        if (isAnonymous) {
          // For anonymous sessions, don't set isAuthenticated to true
          // 🚀 OPTIMIZATION: Only fetch cart if not already fetched
          const currentCartState = window.store?.getState()?.anonymousCart;
          if (!currentCartState?.items || currentCartState.items.length === 0) {
            console.log('[APP] Fetching cart for anonymous session');
            dispatch(fetchCart());
          } else {
            console.log('[APP] Cart already loaded, skipping fetch');
          }
        } else {
          // Set credentials for authenticated session
          dispatch(setCredentials({
            user: session.user,
            token: session.access_token,
            supabaseToken: session.access_token
          }));
          // 🚀 OPTIMIZATION: Only fetch cart if not already fetched
          const currentCartState = window.store?.getState()?.anonymousCart;
          if (!currentCartState?.items || currentCartState.items.length === 0) {
            console.log('[APP] Fetching cart for authenticated session');
            dispatch(fetchCart());
          } else {
            console.log('[APP] Cart already loaded, skipping fetch');
          }
          // Load search preferences for authenticated session
          dispatch(loadSearchPreferencesAsync({ userId: session.user.id }));
        }
      }
    };

    checkExistingSession();

    // 🎯 OPTIMIZED: Removed duplicate auth state change listener
    // The centralized auth service now handles all auth state changes
  }, [dispatch]);

  return (
    <Router>
      <div className="App">
        <Header />
        <main className="App-main">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/about/team" element={<AboutUsPage />} />
            <Route path="/about/experience" element={<AboutUsPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/recipe/:id" element={<RecipePage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<GoogleCallback />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={<CartPage />}
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
