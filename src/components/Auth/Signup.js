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
import FormInput from '../FormInput';
import './Auth.css';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
                navigate('/profile');
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