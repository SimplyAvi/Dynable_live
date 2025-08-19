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

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, logout } from './redux/authSlice';
import { initializeAuth, fetchCart, mergeAnonymousCartWithServer } from './redux/anonymousCartSlice';
import { fetchAllergensPure } from './redux/allergiesSlice';
import { loadSearchPreferencesAsync, mergeSearchPreferencesAsync } from './redux/searchPreferencesSlice';
import { supabase } from './utils/supabaseClient';
import { isAnonymousUser } from './utils/anonymousAuth';
import { initializeAuthService } from './utils/authService';
import { setupPerformanceMonitoring } from './utils/performanceMonitor';
import Header from './components/Header/Header';
import Homepage from './pages/Homepage/Homepage';
import ProductPage from './pages/ProductPage/ProductPage';
import RecipePage from './pages/RecipePage/RecipePage';
import CategoryPage from './pages/Catagory_Testing/CatagoryPage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Auth/Profile';
import GoogleCallback from './components/Auth/GoogleCallback';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import CartPage from './pages/CartPage/CartPage';
import AboutUsPage from './pages/AboutUsPage/AboutUsPage';
import './App.css';
import { clearCartItems } from './redux/anonymousCartSlice';
import { clearSearchPreferencesLocal } from './redux/searchPreferencesSlice';
import { clearAllergies } from './redux/allergiesSlice';
import { clearProducts } from './redux/productSlice'; // 🎯 NEW: Import product clearing
import store from './redux/store'; // Fix: use default import
import { logAuthEvent, logMergeAttempt, logMergeResult } from './utils/debugLogger';

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

  useEffect(() => {
    // Check for existing session first
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Only initialize anonymous auth if no session exists
        dispatch(initializeAuth()).then((result) => {
          if (result.meta.requestStatus === 'fulfilled') {
            // Fetch cart after auth is initialized
            dispatch(fetchCart());
          } else {
            console.error('[APP] Failed to initialize anonymous auth:', result.error);
          }
        });
      } else {
        // Check if this is an anonymous session using improved detection
        const isAnonymous = await isAnonymousUser(session);
        
        if (isAnonymous) {
          // For anonymous sessions, don't set isAuthenticated to true
          // Just fetch cart
          dispatch(fetchCart());
        } else {
          // Set credentials for authenticated session
          dispatch(setCredentials({
            user: session.user,
            token: session.access_token,
            isAuthenticated: true
          }));
          // Fetch cart for existing session
          dispatch(fetchCart());
          // Load search preferences for authenticated session
          dispatch(loadSearchPreferencesAsync({ userId: session.user.id }));
        }
      }
    };

    checkExistingSession();

    // 🎯 OPTIMIZED: Removed duplicate auth state change listener
    // The centralized auth service now handles all auth state changes
    // This eliminates duplicate events and improves performance

    // 🎯 OPTIMIZED: No cleanup needed - auth service handles its own cleanup
  }, [dispatch]);



  // 🛡️ FIXED: Removed duplicate auth state change listener
  // This was causing conflicting logout behavior and query timeouts



  return (
    <Router>
      <div className="App">
        <Header />
        <main className="App-main">
          <Routes>
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/about/team" element={<AboutUsPage />} />
            <Route path="/about/experience" element={<AboutUsPage />} />
            <Route path="/" element={<Homepage />} />
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
