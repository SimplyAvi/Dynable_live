/**
 * Enhanced Google Authentication Callback with Role-Based Support
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * This component handles the Google OAuth callback with enhanced features:
 * - Processes the OAuth response with role information
 * - Handles identity linking for anonymous users
 * - Supports both standard and Supabase tokens
 * - Maintains cart merging functionality
 * - Updates Redux state with role information
 * - Backward compatibility with old token formats
 * 
 * Recent Changes:
 * - Added role-based authentication support
 * - Enhanced identity linking for anonymous users
 * - Support for Supabase tokens
 * - Improved error handling and user feedback
 * - Better cart merging with role-aware state
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials, setLegacyCredentials } from '../../redux/authSlice';
import { mergeCarts, updateCart, fetchCart } from '../../redux/cartSlice';
import { persistor } from '../../redux/store';
import { linkIdentity, cleanupAnonymousData } from '../../utils/supabaseClient';
import { prepareForIdentityLinking } from '../../utils/anonymousUserManager';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(true);
    const hasNavigatedRef = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Prevent double execution
                if (hasNavigatedRef.current) {
                    console.log('[GOOGLE CALLBACK] Already processed, skipping');
                    return;
                }

                // Extract tokens and role information from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                const supabaseToken = urlParams.get('supabaseToken');
                const role = urlParams.get('role');
                const isVerifiedSeller = urlParams.get('isVerifiedSeller') === 'true';
                const convertedFromAnonymous = urlParams.get('convertedFromAnonymous') === 'true';
                
                console.log('[GOOGLE CALLBACK] URL Parameters:', {
                    hasToken: !!token,
                    hasSupabaseToken: !!supabaseToken,
                    role: role,
                    isVerifiedSeller: isVerifiedSeller,
                    convertedFromAnonymous: convertedFromAnonymous
                });
                
                if (!token) {
                    throw new Error('No authentication token received');
                }

                // Store tokens in localStorage
                localStorage.setItem('token', token);
                if (supabaseToken) {
                    localStorage.setItem('supabaseToken', supabaseToken);
                }
                console.log('[GOOGLE CALLBACK] Step 1: Stored tokens in localStorage');
                
                // Fetch user profile with enhanced role information
                console.log('[GOOGLE CALLBACK] Step 2: Fetching user profile');
                const response = await fetch('http://localhost:5001/api/auth/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('[GOOGLE CALLBACK] Profile fetch error:', {
                        status: response.status,
                        statusText: response.statusText,
                        errorData
                    });
                    throw new Error(`Failed to fetch profile: ${response.statusText}`);
                }

                const userData = await response.json();
                console.log('[GOOGLE CALLBACK] Step 3: Received user data:', {
                    hasId: !!userData.id,
                    hasEmail: !!userData.email,
                    hasName: !!userData.name,
                    hasRole: !!userData.role,
                    role: userData.role,
                    isVerifiedSeller: userData.is_verified_seller,
                    convertedFromAnonymous: userData.converted_from_anonymous
                });
                
                // Determine if this is new format (with role) or legacy format
                const isNewFormat = userData.role;
                
                if (isNewFormat) {
                    // New format with role information
                    console.log('[GOOGLE CALLBACK] Using new format with role information');
                    dispatch(setCredentials({
                        user: userData,
                        token: token,
                        supabaseToken: supabaseToken || null
                    }));
                } else {
                    // Legacy format - use backward compatibility
                    console.log('[GOOGLE CALLBACK] Using legacy format - backward compatibility');
                    dispatch(setLegacyCredentials({
                        user: userData,
                        token: token
                    }));
                }
                
                console.log('[GOOGLE CALLBACK] Step 4: Updated Redux store with user data');

                // Purge persisted state after login to avoid stale cart
                await persistor.purge();

                // --- Enhanced cart merging with Supabase identity linking support ---
                console.log('[GOOGLE CALLBACK] Preparing for identity linking...');
                
                // Prepare anonymous user data for identity linking
                const anonymousData = await prepareForIdentityLinking();
                
                if (anonymousData.success) {
                    console.log('[GOOGLE CALLBACK] Anonymous data prepared:', {
                        anonymousId: anonymousData.anonymousId,
                        cartItems: anonymousData.cartItems.length,
                        convertedFromAnonymous: convertedFromAnonymous
                    });
                    
                    // Attempt Supabase identity linking
                    const linkResult = await linkIdentity('google');
                    
                    if (linkResult.success) {
                        console.log('[GOOGLE CALLBACK] Identity linking successful');
                        
                        // Fetch server cart (if any)
                        const serverCartRes = await fetch('http://localhost:5001/api/cart', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        let serverCart = [];
                        if (serverCartRes.ok) {
                            serverCart = await serverCartRes.json();
                        }
                        
                        // Merge carts and update server
                        const merged = mergeCarts(anonymousData.cartItems, serverCart);
                        console.log('[GOOGLE CALLBACK] Merging carts:', { 
                            anonymousCart: anonymousData.cartItems, 
                            serverCart, 
                            merged
                        });
                        
                        const updateResult = await dispatch(updateCart(merged)).unwrap();
                        console.log('[GOOGLE CALLBACK] updateCart completed with result:', updateResult);
                        
                        // Clean up anonymous data after successful linking
                        cleanupAnonymousData();
                    } else {
                        console.warn('[GOOGLE CALLBACK] Identity linking failed:', linkResult.error);
                        // Fallback to regular cart merging
                        const localCart = JSON.parse(localStorage.getItem('anonymous_cart') || '[]');
                        if (localCart.length > 0) {
                            const serverCartRes = await fetch('http://localhost:5001/api/cart', {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            let serverCart = [];
                            if (serverCartRes.ok) {
                                serverCart = await serverCartRes.json();
                            }
                            
                            const merged = mergeCarts(localCart, serverCart);
                            await dispatch(updateCart(merged)).unwrap();
                            localStorage.removeItem('anonymous_cart');
                        }
                    }
                } else {
                    console.log('[GOOGLE CALLBACK] No anonymous data to link');
                }
                
                // Always fetch the latest cart from backend to update Redux
                const fetchRes = await dispatch(fetchCart()).unwrap();
                console.log('[GOOGLE CALLBACK] fetchCart response:', fetchRes);
                // --- End enhanced merge logic ---

                // Handle role-specific redirects
                let redirectTo = localStorage.getItem('postLoginRedirect') || '/';
                
                // Role-specific default redirects
                if (!localStorage.getItem('postLoginRedirect')) {
                    if (userData.role === 'admin') {
                        redirectTo = '/admin/dashboard';
                    } else if (userData.role === 'seller') {
                        redirectTo = '/seller/dashboard';
                    } else if (convertedFromAnonymous) {
                        redirectTo = '/profile'; // Show profile for converted users
                    }
                }
                
                console.log('[GOOGLE CALLBACK] Redirect info:', {
                    postLoginRedirect: localStorage.getItem('postLoginRedirect'),
                    userRole: userData.role,
                    convertedFromAnonymous: convertedFromAnonymous,
                    finalRedirectTo: redirectTo
                });
                
                if (!hasNavigatedRef.current && location.pathname === '/auth/callback') {
                    hasNavigatedRef.current = true;
                    console.log('[GOOGLE CALLBACK] About to navigate to:', redirectTo);
                    navigate(redirectTo, { replace: true });
                    console.log('[GOOGLE CALLBACK] Navigation called, clearing postLoginRedirect');
                    if (redirectTo !== '/') localStorage.removeItem('postLoginRedirect');
                } else {
                    console.log('[GOOGLE CALLBACK] Skipping navigation - already navigated or not on /auth/callback');
                }
                
                setIsProcessing(false);
                
            } catch (error) {
                console.error('[GOOGLE CALLBACK] Authentication error:', error);
                setError(error.message);
                setIsProcessing(false);
                // Redirect to login page after a short delay
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [navigate, dispatch, location]);

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
                {isProcessing && (
                    <div className="processing-indicator">
                        <p>Setting up your account...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleCallback; 