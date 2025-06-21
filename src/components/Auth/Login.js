/**
 * Google Authentication Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component handles user login functionality including:
 * - Regular email/password login
 * - Google OAuth login
 * - Redux state management for auth
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/authSlice';
import { mergeCarts, updateCart, fetchCart } from '../../redux/cartSlice';
import { persistor } from '../../redux/store';
import FormInput from '../FormInput';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hasNavigated, setHasNavigated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                // Store auth token and user data in Redux
                dispatch(setCredentials(data));

                // Purge persisted state after login to avoid stale cart
                await persistor.purge();

                // --- Merge anonymous cart with server cart after login ---
                const localCart = JSON.parse(localStorage.getItem('anonymous_cart') || '[]');
                if (localCart.length > 0) {
                    // Fetch server cart (if any)
                    const serverCartRes = await fetch('http://localhost:5001/api/cart', {
                        headers: { 'Authorization': `Bearer ${data.token}` }
                    });
                    let serverCart = [];
                    if (serverCartRes.ok) {
                        serverCart = await serverCartRes.json();
                    }
                    // Merge carts and update server
                    const merged = mergeCarts(localCart, serverCart);
                    console.log('[LOGIN] Merging carts:', { localCart, serverCart, merged });
                    const updateResult = await dispatch(updateCart(merged)).unwrap();
                    console.log('[LOGIN] updateCart completed with result:', updateResult);
                    localStorage.removeItem('anonymous_cart');
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
                alert('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login.');
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

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=login`;

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
                    />
                    <FormInput
                        type="password"
                        value={password}
                        handleChange={(e) => setPassword(e.target.value)}
                        label="Password"
                        required
                    />
                    <button type="submit" className="auth-button">Login</button>
                </form>
                <div className="auth-divider">
                    <span>OR</span>
                </div>
                <button 
                    onClick={handleGoogleLogin}
                    className="google-login-button"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google logo" />
                    Sign in with Google
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