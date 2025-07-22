/**
 * Main Application Component
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Key Changes from Original:
 * - Added Google OAuth authentication flow
 * - Implemented protected routes for authenticated users
 * - Added new routes for profile and OAuth callback
 * - Integrated Redux for auth state management
 * 
 * Routes:
 * - /: Homepage
 * - /product/:id: Product details
 * - /recipe/:id: Recipe details
 * - /category/:id: Category view
 * - /login: User login
 * - /signup: User registration
 * - /auth/callback: Google OAuth callback
 * - /profile: Protected user profile
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, setCredentials } from './redux/authSlice';
import { initializeAnonymousCartAsync, fetchCart } from './redux/cartSlice';
import { initializeAnonymousUser } from './utils/anonymousUserManager';
import { fetchAllergens } from './redux/allergiesSlice';
import Header from './components/Header/Header';
import Homepage from './pages/Homepage';
import ProductPage from './pages/ProductPage/ProductPage';
import RecipePage from './pages/RecipePage/RecipePage';
import CategoryPage from './pages/Catagory_Testing/CatagoryPage';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Profile from './components/Profile/Profile';
import GoogleCallback from './components/Auth/GoogleCallback';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import CartPage from './pages/CartPage/CartPage';
import AboutUsPage from './pages/AboutUsPage/AboutUsPage';
import './App.css';

// Note: ProtectedRouteComponent is now handled by the ProtectedRoute component
// This wrapper is no longer needed as we use the imported ProtectedRoute component

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  useEffect(() => {
    // Fetch allergens from database on app start
    dispatch(fetchAllergens());
  }, [dispatch]);

  useEffect(() => {
    // Load token from localStorage on app start
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user profile to get user data
      fetch('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(userData => {
        dispatch(setCredentials({ user: userData, token }));
        // Always hydrate cart from backend after login
        dispatch(fetchCart());
      })
      .catch(error => {
        console.error('Error loading user profile:', error);
        localStorage.removeItem('token');
        // Do NOT call initializeAnonymousCart here!
        // Let the next effect run (with no token) and handle it.
      });
    } else if (!isAuthenticated) {
      // No token and not authenticated: initialize Supabase anonymous user
      console.log('[APP] No token found, initializing anonymous user...');
      
      // Initialize Supabase anonymous user first (with fallback support)
      initializeAnonymousUser().then(result => {
        if (result.success) {
          console.log('[APP] Anonymous user initialized:', result.anonymousId, 'Fallback:', result.fallback);
          // Then initialize cart with session
          dispatch(initializeAnonymousCartAsync());
        } else {
          console.error('[APP] Failed to initialize anonymous user:', result.error);
          // Fallback to regular anonymous cart
          dispatch(initializeAnonymousCartAsync());
        }
      });
    }
  }, [dispatch, isAuthenticated]);

  // Always fetch cart from backend when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[APP] User authenticated, fetching cart from backend');
      console.log('[APP] Current location:', window.location.pathname);
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
