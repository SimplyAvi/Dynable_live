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

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/authSlice';
import FormInput from '../FormInput';
import './Auth.css';
import { supabase } from '../../utils/supabaseClient';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    // Handle pre-filled email from login redirect
    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
        if (location.state?.message) {
            setMessage(location.state.message);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) {
                console.error('[SIGNUP] Signup failed:', error);
                alert(error.message || 'Signup failed. Please try again.');
            } else {
                console.log('[SIGNUP] Signup successful:', data);
                
                // Create user in Users table with end_user role
                const { error: userError } = await supabase
                    .from('Users')
                    .insert({
                        supabase_user_id: data.user.id, // Use Supabase UUID for secure RLS
                        email: data.user.email,
                        name: data.user.user_metadata?.name || '',
                        role: 'end_user',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });

                if (userError) {
                    console.error('[SIGNUP] Error creating user in Users table:', userError);
                    // Continue anyway - user is authenticated
                }

                dispatch(setCredentials({
                    user: data.user,
                    token: data.session?.access_token,
                    isAuthenticated: true
                }));
                navigate('/profile');
            }
        } catch (error) {
            console.error('[SIGNUP] Signup error:', error);
            alert('An error occurred during signup. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) {
                console.error('[GOOGLE SIGNUP] Error:', error);
                alert('Google signup failed. Please try again.');
            } else {
                console.log('[GOOGLE SIGNUP] Redirecting to Google...');
                // The redirect will happen automatically
            }
        } catch (error) {
            console.error('[GOOGLE SIGNUP] Error:', error);
            alert('An error occurred during Google signup. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Create Account</h2>
                {message && (
                    <div className="auth-message" style={{
                        padding: '10px',
                        marginBottom: '15px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        color: '#856404'
                    }}>
                        {message}
                    </div>
                )}
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
                        label="Create Password"
                        required
                        disabled={isLoading}
                    />
                    <FormInput
                        type="password"
                        value={confirmPassword}
                        handleChange={(e) => setConfirmPassword(e.target.value)}
                        label="Confirm Password"
                        required
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <div className="auth-divider">
                    <span>OR</span>
                </div>
                <button 
                    onClick={handleGoogleSignup} 
                    className="google-login-button"
                    disabled={isLoading}
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google logo" />
                    {isLoading ? 'Processing...' : 'Continue with Google'}
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