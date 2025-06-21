/**
 * Google Authentication Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component handles the Google OAuth callback:
 * - Processes the OAuth response with enhanced error handling
 * - Stores the authentication token in localStorage
 * - Updates Redux state with user data
 * - Redirects to profile page or login on error
 * 
 * Recent Changes:
 * - Added async/await pattern for better error handling
 * - Implemented error state management
 * - Added user-friendly error display
 * - Improved token validation
 * - Added delayed redirect on error
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/authSlice';
import { mergeCarts, updateCart, fetchCart } from '../../redux/cartSlice';
import { persistor } from '../../redux/store';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [error, setError] = useState(null);
    const hasNavigatedRef = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Prevent double execution
                if (hasNavigatedRef.current) {
                    console.log('[GOOGLE CALLBACK] Already processed, skipping');
                    return;
                }

                const token = new URLSearchParams(window.location.search).get('token');
                console.log('Step 1: Received token from URL:', token ? 'Yes' : 'No');
                
                if (!token) {
                    throw new Error('No token received');
                }

                // Store the token in localStorage
                localStorage.setItem('token', token);
                console.log('Step 2: Stored token in localStorage');
                
                // Fetch user profile
                console.log('Step 3: Fetching user profile');
                const response = await fetch('http://localhost:5001/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Profile fetch error:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData
                    });
                    throw new Error(`Failed to fetch profile: ${response.statusText}`);
                }

                const userData = await response.json();
                console.log('Step 4: Received user data:', {
                    hasId: !!userData.id,
                    hasEmail: !!userData.email,
                    hasName: !!userData.name,
                    hasPicture: !!userData.picture
                });
                
                // Update Redux store with user data
                dispatch(setCredentials({ 
                    user: userData, 
                    token 
                }));
                console.log('Step 5: Updated Redux store with user data');

                // Purge persisted state after login to avoid stale cart
                await persistor.purge();

                // --- Merge anonymous cart with server cart after Google login ---
                const localCart = JSON.parse(localStorage.getItem('anonymous_cart') || '[]');
                if (localCart.length > 0) {
                    // Fetch server cart (if any)
                    const serverCartRes = await fetch('http://localhost:5001/api/cart', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    let serverCart = [];
                    if (serverCartRes.ok) {
                        serverCart = await serverCartRes.json();
                    }
                    // Merge carts and update server
                    const merged = mergeCarts(localCart, serverCart);
                    console.log('[GOOGLE LOGIN] Merging carts:', { localCart, serverCart, merged });
                    console.log('[GOOGLE LOGIN] About to dispatch updateCart with:', merged);
                    const updateResult = await dispatch(updateCart(merged)).unwrap();
                    console.log('[GOOGLE LOGIN] updateCart completed with result:', updateResult);
                    console.log('[GOOGLE LOGIN] updateCart promise resolved successfully');
                    localStorage.removeItem('anonymous_cart');
                }
                // Always fetch the latest cart from backend to update Redux
                const fetchRes = await dispatch(fetchCart()).unwrap();
                console.log('[GOOGLE LOGIN] fetchCart response:', fetchRes);
                // --- End merge logic ---

                // Redirect to intended page after login (e.g., /cart), or home
                const redirectTo = localStorage.getItem('postLoginRedirect') || '/';
                console.log('[GOOGLE CALLBACK] postLoginRedirect value:', localStorage.getItem('postLoginRedirect'));
                console.log('[GOOGLE CALLBACK] redirectTo:', redirectTo);
                console.log('[GOOGLE CALLBACK] hasNavigatedRef.current:', hasNavigatedRef.current);
                console.log('[GOOGLE CALLBACK] Current location:', location.pathname);
                
                if (!hasNavigatedRef.current && location.pathname === '/auth/callback') {
                    hasNavigatedRef.current = true;
                    console.log('[GOOGLE CALLBACK] About to navigate to:', redirectTo);
                    navigate(redirectTo, { replace: true });
                    console.log('[GOOGLE CALLBACK] Navigation called, clearing postLoginRedirect');
                    if (redirectTo !== '/') localStorage.removeItem('postLoginRedirect');
                } else {
                    console.log('[GOOGLE CALLBACK] Skipping navigation - already navigated or not on /auth/callback');
                }
            } catch (error) {
                console.error('Authentication error:', error);
                setError(error.message);
                // Redirect to login page after a short delay
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [navigate, dispatch, location]);

    if (error) {
        return (
            <div className="auth-container">
                <div className="auth-box error">
                    <h2>Authentication Error</h2>
                    <p>{error}</p>
                    <p>Redirecting to login page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Processing login...</h2>
                <p>Please wait while we complete your authentication.</p>
            </div>
        </div>
    );
};

export default GoogleCallback; 