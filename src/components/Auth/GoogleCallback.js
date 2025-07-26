/**
 * Google Authentication Callback - Database-First Cart Merge
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Enhanced callback with robust database-first cart merging:
 * - Completely database-dependent (no Redux state dependency)
 * - Comprehensive error handling and validation
 * - Detailed logging for debugging
 * - Atomic operations with proper cleanup
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/authSlice';
import { supabase } from '../../utils/supabaseClient';
import { setCartItems } from '../../redux/anonymousCartSlice'; // Import setCartItems action

const GoogleCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                console.log('[CALLBACK] 🚀 Starting OAuth callback processing...');
                
                // Get the current session
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session) {
                    console.error('[CALLBACK] ❌ No session found after OAuth');
                    alert('Authentication failed. Please try again.');
                    navigate('/login');
                    return;
                }
                
                console.log('[CALLBACK] ✅ Session found:', {
                    userId: session.user.id,
                    email: session.user.email,
                    isAuthenticated: !!session.user.email
                });
                
                // 🎯 DATABASE-FIRST APPROACH: Check for anonymous user ID for cart merge
                const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
                
                if (anonymousUserId) {
                    console.log('[CALLBACK] 🔍 Found anonymous user ID for cart merge:', anonymousUserId);
                    console.log('[CALLBACK] Current authenticated user ID:', session.user.id);
                    
                    // Validate user IDs are different
                    if (anonymousUserId === session.user.id) {
                        console.warn('[CALLBACK] ⚠️  Anonymous and authenticated user IDs are the same, skipping merge');
                        localStorage.removeItem('anonymousUserIdForMerge');
                    } else {
                        // 🎯 PERFORM DATABASE-FIRST CART MERGE
                        await performCartMerge(anonymousUserId, session.user.id);
                    }
                } else {
                    console.log('[CALLBACK] ℹ️  No anonymous user ID found for merge');
                }
                
                // Set user credentials in Redux
                console.log('[CALLBACK] 💾 Setting user credentials in Redux...');
                dispatch(setCredentials({
                    user: session.user,
                    token: session.access_token,
                    isAuthenticated: true
                }));
                
                // Navigate to home page
                console.log('[CALLBACK] 🏠 Navigating to home page...');
                navigate('/');
                
            } catch (error) {
                console.error('[CALLBACK] ❌ Error handling auth callback:', error);
                alert('Authentication error: ' + error.message);
                navigate('/login');
            }
        };
        
        // 🎯 DATABASE-FIRST CART MERGE FUNCTION
        const performCartMerge = async (anonymousUserId, authenticatedUserId) => {
            try {
                console.log('[MERGE] 🚀 Starting database-first cart merge...');
                console.log('[MERGE] Anonymous user ID:', anonymousUserId);
                console.log('[MERGE] Authenticated user ID:', authenticatedUserId);
                
                // 🎯 STEP 1: Use database function to perform complete merge (bypasses RLS)
                console.log('[MERGE] 🔍 Step 1: Calling database merge function...');
                const { data: mergeResult, error: mergeError } = await supabase
                    .rpc('merge_carts_safe', {
                        anonymous_user_id: anonymousUserId,
                        authenticated_user_id: authenticatedUserId
                    });
                
                if (mergeError) {
                    console.error('[MERGE] ❌ Error calling merge function:', mergeError);
                    throw new Error('Failed to merge carts: ' + mergeError.message);
                }
                
                console.log('[MERGE] ✅ Database merge result:', mergeResult);
                
                // Check if merge was successful
                if (!mergeResult.success) {
                    console.error('[MERGE] ❌ Database merge failed:', mergeResult.error);
                    throw new Error('Database merge failed: ' + mergeResult.error);
                }
                
                // 🎯 STEP 2: Update Redux state with merged cart
                console.log('[MERGE] 🔄 Step 2: Updating Redux state...');
                const mergedItems = mergeResult.merged_items || [];
                dispatch(setCartItems(mergedItems));
                
                // 🎯 STEP 3: Clean up localStorage
                localStorage.removeItem('anonymousUserIdForMerge');
                
                console.log('[MERGE] ✅ Cart merge completed successfully');
                console.log('[MERGE] Summary:', {
                    anonymousItemsCount: mergeResult.anonymous_items_count,
                    authenticatedItemsCount: mergeResult.authenticated_items_count,
                    mergedItemsCount: mergeResult.merged_items_count,
                    timestamp: mergeResult.timestamp
                });
                
            } catch (error) {
                console.error('[MERGE] ❌ Cart merge failed:', error);
                // Clean up localStorage even if merge fails
                localStorage.removeItem('anonymousUserIdForMerge');
                throw error;
            }
        };
        
        handleAuthCallback();
    }, [dispatch, navigate]);

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
                Please wait while we complete your authentication and merge your cart.
            </div>
        </div>
    );
};

export default GoogleCallback; 