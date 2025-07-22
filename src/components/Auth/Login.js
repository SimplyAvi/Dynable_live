/**
 * Enhanced Login Component with Role-Based Authentication
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component handles user login functionality including:
 * - Regular email/password login with role support
 * - Google OAuth login
 * - Redux state management for auth with role information
 * - Backward compatibility with old token formats
 * - Cart merging functionality
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials, setLegacyCredentials } from '../../redux/authSlice';
import { mergeCarts, updateCart, fetchCart } from '../../redux/cartSlice';
import { persistor } from '../../redux/store';
import { prepareForIdentityLinking, cleanupAnonymousData } from '../../utils/anonymousUserManager';
import FormInput from '../FormInput';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hasNavigated, setHasNavigated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const response = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[LOGIN] Received response:', {
                    hasUser: !!data.user,
                    hasToken: !!data.token,
                    hasRole: !!data.user?.role,
                    hasSupabaseToken: !!data.supabaseToken
                });

                // Determine if this is new format (with role) or legacy format
                const isNewFormat = data.user && data.user.role;
                
                if (isNewFormat) {
                    // New format with role information
                    console.log('[LOGIN] Using new format with role information');
                    dispatch(setCredentials({
                        user: data.user,
                        token: data.token,
                        supabaseToken: data.supabaseToken || null
                    }));
                } else {
                    // Legacy format - use backward compatibility
                    console.log('[LOGIN] Using legacy format - backward compatibility');
                    dispatch(setLegacyCredentials({
                        user: data.user,
                        token: data.token
                    }));
                }

                // Store tokens in localStorage
                localStorage.setItem('token', data.token);
                if (data.supabaseToken) {
                    localStorage.setItem('supabaseToken', data.supabaseToken);
                }

                // Purge persisted state after login to avoid stale cart
                await persistor.purge();

                // --- Enhanced cart merging with Supabase identity linking support ---
                console.log('[LOGIN] Preparing for identity linking...');
                
                // Prepare anonymous user data for identity linking
                const anonymousData = await prepareForIdentityLinking();
                
                if (anonymousData.success) {
                    console.log('[LOGIN] Anonymous data prepared:', {
                        anonymousId: anonymousData.anonymousId,
                        cartItems: anonymousData.cartItems.length
                    });
                    
                    // Fetch server cart (if any)
                    const serverCartRes = await fetch('http://localhost:5001/api/cart', {
                        headers: { 'Authorization': `Bearer ${data.token}` }
                    });
                    let serverCart = [];
                    if (serverCartRes.ok) {
                        serverCart = await serverCartRes.json();
                    }
                    
                    // Merge carts and update server
                    const merged = mergeCarts(anonymousData.cartItems, serverCart);
                    console.log('[LOGIN] Merging carts:', { 
                        anonymousCart: anonymousData.cartItems, 
                        serverCart, 
                        merged 
                    });
                    
                    const updateResult = await dispatch(updateCart(merged)).unwrap();
                    console.log('[LOGIN] updateCart completed with result:', updateResult);
                    
                    // Clean up anonymous data after successful login
                    cleanupAnonymousData();
                } else {
                    console.log('[LOGIN] No anonymous data to merge');
                }
                // Always fetch the latest cart from backend to update Redux
                const fetchRes = await dispatch(fetchCart()).unwrap();
                console.log('[LOGIN] fetchCart response:', fetchRes);
                // --- End merge logic ---

                // Redirect to intended page after login (e.g., /cart), or home
                const redirectTo = localStorage.getItem('postLoginRedirect') || '/';
                console.log('[LOGIN] postLoginRedirect value:', localStorage.getItem('postLoginRedirect'));
                console.log('[LOGIN] redirectTo:', redirectTo);
                console.log('[LOGIN] hasNavigated:', hasNavigated);
                
                if (!hasNavigated) {
                    setHasNavigated(true);
                    navigate(redirectTo, { replace: true });
                    // Clear the redirect after navigation to prevent issues with React StrictMode
                    if (redirectTo !== '/') localStorage.removeItem('postLoginRedirect');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('[LOGIN] Login failed:', errorData);
                alert(errorData.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('[LOGIN] Login error:', error);
            alert('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        const redirectUri = 'http://localhost:5001/api/auth/google/callback';
        const scopes = [
            'email',
            'profile',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'openid'
        ].join(' ');

        // Get anonymous cart data for identity linking
        const anonymousCart = JSON.parse(localStorage.getItem('anonymous_cart') || '[]');
        const anonymousUserId = localStorage.getItem('anonymous_user_id');
        
        // Add cart data to state parameter for Google OAuth
        const stateData = {
            type: 'login',
            anonymousUserId: anonymousUserId,
            cartData: anonymousCart
        };

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=${encodeURIComponent(JSON.stringify(stateData))}`;

        window.location.href = googleAuthUrl;
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Login to Dynable</h2>
                <form onSubmit={handleSubmit}>
                    <FormInput
                        type="email"
                        value={email}
                        handleChange={(e) => setEmail(e.target.value)}
                        label="Email Address"
                        required
                        disabled={isLoading}
                    />
                    <FormInput
                        type="password"
                        value={password}
                        handleChange={(e) => setPassword(e.target.value)}
                        label="Password"
                        required
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="auth-divider">
                    <span>OR</span>
                </div>
                <button 
                    onClick={handleGoogleLogin}
                    className="google-login-button"
                    disabled={isLoading}
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google logo" />
                    {isLoading ? 'Processing...' : 'Sign in with Google'}
                </button>
                <p className="auth-switch">
                    Don't have an account?{' '}
                    <span onClick={() => navigate('/signup')} className="auth-link">
                        Sign up
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Login; 