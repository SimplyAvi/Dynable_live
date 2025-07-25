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
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, setCredentials, logout, clearCredentials } from './redux/authSlice';
import { initializeAuth, fetchCart, mergeAnonymousCartWithServer } from './redux/anonymousCartSlice';
import { fetchAllergensPure } from './redux/allergiesSlice';
import { supabase } from './utils/supabaseClient';
import { isAnonymousUser } from './utils/anonymousAuth';
import store from './redux/store';
import Header from './components/Header/Header';
import Homepage from './pages/Homepage';
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

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => {
    console.log('[APP] Current Redux state:', state);
    console.log('[APP] Auth state:', state.auth);
    console.log('[APP] AnonymousCart state:', state.anonymousCart);
    return state.auth?.isAuthenticated || false;
  });

  useEffect(() => {
    // Fetch allergens from Supabase database on app start
    dispatch(fetchAllergensPure());
  }, [dispatch]);

  useEffect(() => {
    // Check for existing session first
    const checkExistingSession = async () => {
      console.log('[APP] Starting checkExistingSession...');
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('[APP] Session check result:', session ? 'Session found' : 'No session');
      if (session) {
        console.log('[APP] Session user ID:', session.user.id);
        console.log('[APP] Session user:', session.user);
      }
      
      if (!session) {
        // Only initialize anonymous auth if no session exists
        console.log('[APP] No existing session, initializing anonymous auth...');
        dispatch(initializeAuth()).then((result) => {
          console.log('[APP] initializeAuth result:', result);
          if (result.meta.requestStatus === 'fulfilled') {
            console.log('[APP] Anonymous auth initialized successfully');
            // Fetch cart after auth is initialized
            dispatch(fetchCart());
          } else {
            console.error('[APP] Failed to initialize anonymous auth:', result.error);
          }
        });
      } else {
        // Check if this is an anonymous session using improved detection
        const isAnonymous = isAnonymousUser(session);
        console.log('[APP] Is anonymous session:', isAnonymous);
        
        if (isAnonymous) {
          console.log('[APP] Anonymous session found, not setting authenticated state');
          // For anonymous sessions, don't set isAuthenticated to true
          // Just fetch cart
          dispatch(fetchCart());
        } else {
          console.log('[APP] Authenticated session found, setting credentials');
          // Set credentials for authenticated session
          dispatch(setCredentials({
            user: session.user,
            token: session.access_token,
            isAuthenticated: true
          }));
          // Fetch cart for existing session
          dispatch(fetchCart());
        }
      }
    };

    checkExistingSession();

    // Set up Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SUPABASE AUTH] Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[SUPABASE AUTH] User signed in:', session.user);
          
          // Check if this is an anonymous session using improved detection
          const isAnonymous = isAnonymousUser(session);
          
          if (isAnonymous) {
            console.log('[SUPABASE AUTH] Anonymous session signed in, not setting authenticated state');
            // For anonymous sessions, just fetch cart
            dispatch(fetchCart());
          } else {
            console.log('[SUPABASE AUTH] Authenticated user signed in, setting credentials');
            
            // Check if we have a stored anonymous user ID for cart merging
            const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
            
            if (anonymousUserId) {
              console.log('[SUPABASE AUTH] Found stored anonymous user ID, merging carts');
              try {
                // Import the merge function
                const { mergeAnonymousCartWithStoredId } = await import('./utils/anonymousAuth');
                await mergeAnonymousCartWithStoredId(anonymousUserId, session.user.id);
                console.log('[SUPABASE AUTH] Cart merge completed successfully');
                // Clear the stored ID after successful merge
                localStorage.removeItem('anonymousUserIdForMerge');
              } catch (error) {
                console.error('[SUPABASE AUTH] Cart merge failed:', error);
              }
            }
            
            // Set credentials in Redux for authenticated users
            dispatch(setCredentials({
              user: session.user,
              token: session.access_token,
              isAuthenticated: true
            }));
            // Fetch cart after auth is initialized
            dispatch(fetchCart());
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[SUPABASE AUTH] User signed out');
          
          // Clear auth state completely
          dispatch(logout());
          
          // Don't immediately reinitialize anonymous auth
          // Let the user stay logged out until they interact with the app
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('[SUPABASE AUTH] Token refreshed');
          
          // Only update token if user is still authenticated
          // Don't automatically set isAuthenticated to true
          // This prevents interference with logout state
        }
      }
    );

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [dispatch]);

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
