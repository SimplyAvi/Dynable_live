/**
 * Google Authentication Callback with Anonymous Auth Support
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Updated for Anonymous Auth:
 * - Uses identity linking for anonymous users
 * - Automatic cart transfer via Supabase
 * - No manual cart merging required
 * - Clean, Supabase-native approach
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/authSlice';
import { linkAnonymousToGoogle, mergeAnonymousCartWithStoredId } from '../../utils/anonymousAuth';
import { supabase } from '../../utils/supabaseClient';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const handleAuthCallback = async () => {
            console.log('[GOOGLE CALLBACK] useEffect triggered');
            try {
                // Get the current session after OAuth redirect
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('[GOOGLE CALLBACK] Error getting session:', error);
                    navigate('/login?error=auth_failed');
                    return;
                }

                if (session) {
                    console.log('[GOOGLE CALLBACK] Session found:', session);
                    
                    // Check if we have a stored anonymous user ID for cart merging
                    const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
                    console.log('[GOOGLE CALLBACK] anonymousUserIdForMerge from localStorage:', anonymousUserId);
                    if (anonymousUserId) {
                        console.log('[GOOGLE CALLBACK] Attempting to merge anonymous cart with authenticated cart...');
                        await mergeAnonymousCartWithStoredId(anonymousUserId, session.user.id);
                        localStorage.removeItem('anonymousUserIdForMerge');
                        console.log('[GOOGLE CALLBACK] Cart merge complete, removed anonymousUserIdForMerge from localStorage');
                    }
                }
            } catch (err) {
                console.error('[GOOGLE CALLBACK] Error in handleAuthCallback:', err);
            }
        };
        handleAuthCallback();
    }, [navigate]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column'
        }}>
            <div>Processing Google login...</div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Please wait while we complete your authentication.
            </div>
        </div>
    );
};

export default GoogleCallback; 