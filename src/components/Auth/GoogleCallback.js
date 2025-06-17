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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/authSlice';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
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

                // Redirect to homepage
                console.log('Step 6: Redirecting to homepage');
                navigate('/');
            } catch (error) {
                console.error('Authentication error:', error);
                setError(error.message);
                // Redirect to login page after a short delay
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [navigate, dispatch]);

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