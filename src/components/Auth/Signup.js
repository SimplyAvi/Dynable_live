/**
 * Google Authentication Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component handles user registration functionality including:
 * - Regular email/password signup
 * - Google OAuth signup
 * - Password confirmation
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/authSlice';
import { mergeCarts, updateCart, fetchCart } from '../../redux/cartSlice';
import { persistor } from '../../redux/store';
import FormInput from '../FormInput';
import './Auth.css';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [hasNavigated, setHasNavigated] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/api/auth/signup', {
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

                // Purge persisted state after signup to avoid stale cart
                await persistor.purge();

                // --- Merge anonymous cart with server cart after signup ---
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
                    console.log('[SIGNUP] Merging carts:', { localCart, serverCart, merged });
                    const updateResult = await dispatch(updateCart(merged)).unwrap();
                    console.log('[SIGNUP] updateCart completed with result:', updateResult);
                    localStorage.removeItem('anonymous_cart');
                }
                // Always fetch the latest cart from backend to update Redux
                const fetchRes = await dispatch(fetchCart()).unwrap();
                console.log('[SIGNUP] fetchCart response:', fetchRes);
                // --- End merge logic ---

                // Redirect to intended page after signup (e.g., /cart), or profile
                const redirectTo = localStorage.getItem('postLoginRedirect') || '/profile';
                console.log('[SIGNUP] postLoginRedirect value:', localStorage.getItem('postLoginRedirect'));
                console.log('[SIGNUP] redirectTo:', redirectTo);
                console.log('[SIGNUP] hasNavigated:', hasNavigated);
                
                if (!hasNavigated) {
                    setHasNavigated(true);
                    navigate(redirectTo, { replace: true });
                    // Clear the redirect after navigation to prevent issues with React StrictMode
                    if (redirectTo !== '/profile') localStorage.removeItem('postLoginRedirect');
                }
            } else {
                alert('Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('An error occurred during signup.');
        }
    };

    const handleGoogleSignup = () => {
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
            `&state=signup`;  // Add state parameter to indicate this is a signup attempt

        window.location.href = googleAuthUrl;
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Create Account</h2>
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
                        label="Create Password"
                        required
                    />
                    <FormInput
                        type="password"
                        value={confirmPassword}
                        handleChange={(e) => setConfirmPassword(e.target.value)}
                        label="Confirm Password"
                        required
                    />
                    <button type="submit" className="auth-button">Sign Up</button>
                </form>
                <div className="auth-divider">
                    <span>OR</span>
                </div>
                <button onClick={handleGoogleSignup} className="google-login-button">
                    <img src="https://www.google.com/favicon.ico" alt="Google logo" />
                    Continue with Google
                </button>
                <p className="auth-switch">
                    Already have an account?{' '}
                    <span onClick={() => navigate('/login')} className="auth-link">
                        Login
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Signup; 