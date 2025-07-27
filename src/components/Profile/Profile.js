/**
 * Supabase Authentication Implementation
 * Author: Justin Linzan
 * Date: July 2025
 * 
 * This component displays user profile information:
 * - Fetches user data using Supabase Auth
 * - Displays user details from Supabase Users table
 * - Handles loading and error states
 * - Includes profile management functions
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../redux/authSlice';
import { supabase } from '../../utils/supabaseClient';
import { getUserProfileFromSupabase } from '../../utils/supabaseQueries';
import './Profile.css';

const Profile = () => {
    const user = useSelector(selectCurrentUser);
    const dispatch = useDispatch();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get user profile from Supabase Auth
                const userProfile = await getUserProfileFromSupabase();
                
                // Get additional profile data from Users table if needed
                const { data: userData, error: userError } = await supabase
                    .from('Users')
                    .select('*')
                    .eq('supabase_user_id', userProfile.id)
                    .single();
                
                if (userError && userError.code !== 'PGRST116') {
                    // PGRST116 is "not found" - this is okay for new users
                    console.warn('[PROFILE] No user data in Users table:', userError);
                }
                
                // Combine auth data with user table data
                const combinedProfile = {
                    ...userProfile,
                    ...userData,
                    // Ensure we have the essential fields
                    id: userProfile.id,
                    email: userProfile.email,
                    name: userProfile.user_metadata?.full_name || userData?.name || 'Not set',
                    picture: userProfile.user_metadata?.avatar_url || userData?.profile_picture || null,
                    created_at: userProfile.created_at,
                    last_sign_in: userProfile.last_sign_in_at
                };
                
                setProfile(combinedProfile);
                console.log('[PROFILE] Profile loaded successfully:', combinedProfile.email);
                
            } catch (err) {
                console.error('[PROFILE] Error fetching profile:', err);
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSignOut = async () => {
        try {
            setIsUpdating(true);
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                throw error;
            }
            
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('anonymousUserIdForMerge');
            
            // Redirect to home page
            window.location.href = '/';
            
        } catch (err) {
            console.error('[PROFILE] Error signing out:', err);
            setError('Failed to sign out');
        } finally {
            setIsUpdating(false);
        }
    };

    const updateProfile = async (updates) => {
        try {
            setIsUpdating(true);
            setError(null);
            
            // Update user metadata in Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                data: updates
            });
            
            if (authError) {
                throw authError;
            }
            
            // Update Users table if needed
            if (profile?.id) {
                const { error: userError } = await supabase
                    .from('Users')
                    .upsert({
                        supabase_user_id: profile.id,
                        ...updates,
                        updated_at: new Date().toISOString()
                    });
                
                if (userError) {
                    console.warn('[PROFILE] Could not update Users table:', userError);
                }
            }
            
            // Refresh profile data
            const updatedProfile = await getUserProfileFromSupabase();
            setProfile(prev => ({ ...prev, ...updatedProfile, ...updates }));
            
            console.log('[PROFILE] Profile updated successfully');
            
        } catch (err) {
            console.error('[PROFILE] Error updating profile:', err);
            setError('Failed to update profile');
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-box">
                    <h2>Loading profile...</h2>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-container">
                <div className="profile-box">
                    <h2>Error</h2>
                    <p className="error-message">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="retry-button"
                    >
                        Retry
                    </button>
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
                    <p><strong>User ID:</strong> {profile?.id}</p>
                    <p><strong>Member since:</strong> {new Date(profile?.created_at).toLocaleDateString()}</p>
                    {profile?.last_sign_in && (
                        <p><strong>Last sign in:</strong> {new Date(profile.last_sign_in).toLocaleString()}</p>
                    )}
                </div>
                
                <div className="profile-actions">
                    <button 
                        onClick={handleSignOut}
                        disabled={isUpdating}
                        className="sign-out-button"
                    >
                        {isUpdating ? 'Signing out...' : 'Sign Out'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile; 