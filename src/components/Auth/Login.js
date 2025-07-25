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
import { setCredentials } from '../../redux/authSlice';
import FormInput from '../FormInput';
import './Auth.css';
import { supabase } from '../../utils/supabaseClient';
import { isAnonymousUser } from '../../utils/anonymousAuth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('[LOGIN] Login failed:', error);
                
                // Check if user doesn't exist (common error codes)
                if (error.message?.includes('Invalid login credentials') || 
                    error.message?.includes('Email not confirmed') ||
                    error.code === 'invalid_grant') {
                    
                    // User doesn't exist - redirect to signup with pre-filled email
                    console.log('[LOGIN] User not found, redirecting to signup');
                    navigate('/signup', { 
                        state: { 
                            email: email,
                            fromLogin: true,
                            message: 'Account not found. Please sign up to continue.'
                        }
                    });
                    return;
                }
                
                // Other errors (wrong password, etc.)
                alert(error.message || 'Login failed. Please check your credentials.');
            } else {
                console.log('[LOGIN] Login successful:', data);
                
                // Check if user exists in Users table
                const userExists = await checkUserExists(data.user.email);
                if (!userExists) {
                    // User authenticated but doesn't exist in Users table
                    // This shouldn't happen with email/password, but handle it
                    navigate('/signup', { 
                        state: { 
                            email: data.user.email,
                            fromLogin: true,
                            message: 'Please complete your profile to continue.'
                        }
                    });
                    return;
                }
                
                dispatch(setCredentials({
                    user: data.user,
                    token: data.session?.access_token,
                    isAuthenticated: true
                }));

                // Check for post-login redirect (e.g., from checkout)
                const postLoginRedirect = localStorage.getItem('postLoginRedirect');
                if (postLoginRedirect) {
                    console.log('[LOGIN] Redirecting to:', postLoginRedirect);
                    localStorage.removeItem('postLoginRedirect');
                    navigate(postLoginRedirect);
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.error('[LOGIN] Login error:', error);
            alert('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            // First, ensure we have an anonymous session
            const { data: { session } } = await supabase.auth.getSession();
            
            let anonymousUserId = null;
            
            if (session && isAnonymousUser(session)) {
                // Use existing anonymous session
                anonymousUserId = session.user.id;
                console.log('[LOGIN] Using existing anonymous session:', anonymousUserId);
            } else {
                // No session or not anonymous, create one
                console.log('[LOGIN] No anonymous session found, creating one...');
                const { data, error } = await supabase.auth.signInAnonymously();
                
                if (error) {
                    console.error('[LOGIN] Failed to create anonymous session:', error);
                    return;
                }
                
                anonymousUserId = data.user.id;
                console.log('[LOGIN] Created new anonymous session:', anonymousUserId);
            }
            
            // Store the current anonymous user ID for cart merging
            console.log('[LOGIN] Storing anonymous user ID for cart merge:', anonymousUserId);
            localStorage.setItem('anonymousUserIdForMerge', anonymousUserId);
            console.log('[LOGIN] anonymousUserIdForMerge in localStorage:', localStorage.getItem('anonymousUserIdForMerge'));
            
            // Redirect to Google OAuth
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            
            if (error) {
                console.error('[LOGIN] Google OAuth error:', error);
            }
        } catch (error) {
            console.error('[LOGIN] Error initiating Google login:', error);
        }
    };

    // Check if user exists in Users table and handle anonymous conversion
    const checkUserExists = async (email) => {
        try {
            const { data: userData, error } = await supabase
                .from('Users')
                .select('*')
                .eq('email', email)
                .single();

            if (error && error.code === 'PGRST116') {
                // User doesn't exist in Users table - redirect to signup
                console.log('[LOGIN] User not found in Users table, redirecting to signup');
                navigate('/signup', { 
                    state: { 
                        email: email,
                        fromGoogle: true,
                        message: 'Please complete your profile to continue'
                    }
                });
                return false;
            }
            return true;
        } catch (error) {
            console.error('[LOGIN] Error checking user existence:', error);
            return false;
        }
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