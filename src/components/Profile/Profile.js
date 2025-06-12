/**
 * Google Authentication Implementation
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component displays user profile information:
 * - Fetches user data using auth token
 * - Displays user details
 * - Handles loading and error states
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/authSlice';
import './Profile.css';

const Profile = () => {
    const user = useSelector(selectCurrentUser);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }

                const response = await fetch('http://localhost:5001/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }

                const data = await response.json();
                setProfile(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-box">
                    <h2>Loading profile...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-container">
                <div className="profile-box">
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-box">
                <h2>Profile</h2>
                {profile?.picture && (
                    <img 
                        src={profile.picture} 
                        alt="Profile" 
                        className="profile-picture"
                    />
                )}
                <div className="profile-info">
                    <p><strong>Name:</strong> {profile?.name || 'Not set'}</p>
                    <p><strong>Email:</strong> {profile?.email}</p>
                </div>
            </div>
        </div>
    );
};

export default Profile; 