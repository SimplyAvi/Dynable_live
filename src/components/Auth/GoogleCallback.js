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
import { mergeSearchPreferencesAsync, setSelectedAllergens, setSearchTerm } from '../../redux/searchPreferencesSlice';
import { setSearchbarValue } from '../../redux/searchbarSlice';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                console.log('[CALLBACK] 🚀 Starting OAuth callback processing...');
                
                // 🎯 DEBUG: Check OAuth entry point
                const referrer = document.referrer;
                const currentUrl = window.location.href;
                console.log('[CALLBACK] 🔍 OAuth Entry Point Debug:', {
                    referrer,
                    currentUrl,
                    hasReferrer: !!referrer,
                    isFromLogin: referrer.includes('/login'),
                    isFromSignup: referrer.includes('/signup'),
                    isDirectOAuth: !referrer || referrer === currentUrl
                });

                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session) {
                    console.error('[CALLBACK] ❌ No session found after OAuth');
                    navigate('/login');
                    return;
                }

                console.log('[CALLBACK] ✅ Session found:', {
                    userId: session.user.id,
                    email: session.user.email,
                    isAuthenticated: true
                });

                // 🎯 FALLBACK: Check if search preferences need to be saved
                const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
                if (anonymousUserId) {
                    console.log('[CALLBACK] 🔍 Found anonymous user ID for merge:', anonymousUserId);
                    console.log('[CALLBACK] Current authenticated user ID:', session.user.id);
                    
                    // 🎯 FALLBACK SAVE: If no search preferences exist for anonymous user, try to save current state
                    try {
                        const { data: existingPrefs, error: checkError } = await supabase
                            .from('SearchPreferences')
                            .select('*')
                            .eq('supabase_user_id', anonymousUserId);
                        
                        if (checkError) {
                            console.warn('[CALLBACK] ⚠️ Could not check existing preferences:', checkError);
                        } else if (!existingPrefs || existingPrefs.length === 0) {
                            console.log('[CALLBACK] 🔍 No existing search preferences found for anonymous user');
                            console.log('[CALLBACK] 🎯 This suggests the save logic was bypassed - attempting fallback save');
                            
                            // 🎯 FALLBACK: Try multiple sources for search term and allergens
                            let fallbackSearchTerm = '';
                            let fallbackAllergens = [];
                            
                            // Method 1: Try to get from localStorage (if user had search in session)
                            const storedSearchTerm = localStorage.getItem('anonymousSearchTerm');
                            const storedAllergens = localStorage.getItem('anonymousAllergens');
                            
                            if (storedSearchTerm) {
                                fallbackSearchTerm = storedSearchTerm;
                                console.log('[CALLBACK] 🎯 Found search term in localStorage:', fallbackSearchTerm);
                            }
                            
                            if (storedAllergens) {
                                try {
                                    fallbackAllergens = JSON.parse(storedAllergens);
                                    console.log('[CALLBACK] 🎯 Found allergens in localStorage:', fallbackAllergens);
                                } catch (parseError) {
                                    console.warn('[CALLBACK] ⚠️ Failed to parse stored allergens:', parseError);
                                }
                            }
                            
                            // Method 2: Try to get from Redux store (if available)
                            if (!fallbackSearchTerm || fallbackAllergens.length === 0) {
                                try {
                                    const currentState = window.__REDUX_STORE__?.getState();
                                    if (currentState) {
                                        if (!fallbackSearchTerm) {
                                            fallbackSearchTerm = currentState.searchPreferences?.searchTerm || '';
                                        }
                                        if (fallbackAllergens.length === 0) {
                                            fallbackAllergens = currentState.searchPreferences?.selectedAllergens || [];
                                        }
                                        console.log('[CALLBACK] 🎯 Found state in Redux store:', {
                                            searchTerm: fallbackSearchTerm,
                                            allergens: fallbackAllergens
                                        });
                                    }
                                } catch (reduxError) {
                                    console.warn('[CALLBACK] ⚠️ Failed to access Redux store:', reduxError);
                                }
                            }
                            
                            // Method 3: Try to get from URL parameters (if search was in URL)
                            if (!fallbackSearchTerm) {
                                const urlParams = new URLSearchParams(window.location.search);
                                const urlSearchTerm = urlParams.get('search') || urlParams.get('q');
                                if (urlSearchTerm) {
                                    fallbackSearchTerm = urlSearchTerm;
                                    console.log('[CALLBACK] 🎯 Found search term in URL params:', fallbackSearchTerm);
                                }
                            }
                            
                            console.log('[CALLBACK] 🎯 Final fallback save attempt:', {
                                searchTerm: fallbackSearchTerm,
                                allergens: fallbackAllergens,
                                hasSearchTerm: !!fallbackSearchTerm,
                                hasAllergens: fallbackAllergens.length > 0
                            });
                            
                            if (fallbackSearchTerm || fallbackAllergens.length > 0) {
                                try {
                                    const fallbackResult = await supabase.rpc('save_search_preferences', {
                                        p_user_id: anonymousUserId,
                                        p_search_term: fallbackSearchTerm,
                                        p_allergens: fallbackAllergens
                                    });
                                    
                                    if (fallbackResult.error) {
                                        console.warn('[CALLBACK] ⚠️ Fallback save failed:', fallbackResult.error);
                                    } else {
                                        console.log('[CALLBACK] ✅ Fallback save successful:', fallbackResult.data);
                                    }
                                } catch (fallbackError) {
                                    console.warn('[CALLBACK] ⚠️ Fallback save error:', fallbackError);
                                }
                            } else {
                                console.log('[CALLBACK] ℹ️ No search term or allergens found for fallback save');
                            }
                        } else {
                            console.log('[CALLBACK] ✅ Existing search preferences found for anonymous user');
                        }
                    } catch (fallbackCheckError) {
                        console.warn('[CALLBACK] ⚠️ Fallback check failed:', fallbackCheckError);
                    }
                }

                // 🎯 SEARCH PREFERENCES MERGE
                console.log('[CALLBACK] 🔄 Starting search preferences merge...');
                if (anonymousUserId) {
                    await performSearchPreferencesMerge(anonymousUserId, session.user.id);
                }

                // 🎯 CART MERGE
                console.log('[CALLBACK] 🔄 Starting cart merge...');
                if (anonymousUserId) {
                    await performCartMerge(anonymousUserId, session.user.id);
                }

                // 🧹 Clean up localStorage after successful merges
                console.log('[CALLBACK] 🧹 Cleaning up localStorage after successful merges...');
                localStorage.removeItem('anonymousUserIdForMerge');
                localStorage.removeItem('anonymous_user_id');

                // 💾 Set user credentials in Redux
                console.log('[CALLBACK] 💾 Setting user credentials in Redux...');
                dispatch(setCredentials({
                    user: session.user,
                    token: session.access_token,
                    supabaseToken: session.access_token
                }));

                // 🏠 Navigate to home page
                console.log('[CALLBACK] 🏠 Navigating to home page...');
                navigate('/');

            } catch (error) {
                console.error('[CALLBACK] ❌ Error during OAuth callback:', error);
                navigate('/login');
            }
        };
        
        // 🎯 DATABASE-FIRST CART MERGE FUNCTION
        const performCartMerge = async (anonymousUserId, authenticatedUserId) => {
            try {
                console.log('[MERGE] 🚀 Starting database-first cart merge...');
                console.log('[MERGE] Anonymous user ID:', anonymousUserId);
                console.log('[MERGE] Authenticated user ID:', authenticatedUserId);
                
                // 🎯 STEP 1: Try database function first
                console.log('[MERGE] 🔍 Step 1: Calling database merge function...');
                const { data: mergeResult, error: mergeError } = await supabase
                    .rpc('merge_carts_safe', {
                        anonymous_user_id: anonymousUserId,
                        authenticated_user_id: authenticatedUserId
                    });
                
                if (mergeError) {
                    console.error('[MERGE] ❌ Database function failed, trying fallback method:', mergeError);
                    
                    // 🚨 FALLBACK: Use the utility function if database function doesn't exist
                    console.log('[MERGE] 🔄 Using fallback cart merge method...');
                    const { mergeAnonymousCartWithStoredId } = await import('../../utils/anonymousAuth.js');
                    const fallbackResult = await mergeAnonymousCartWithStoredId(anonymousUserId, authenticatedUserId);
                    
                    if (fallbackResult.success) {
                        console.log('[MERGE] ✅ Fallback merge successful:', fallbackResult);
                        dispatch(setCartItems(fallbackResult.mergedItems || []));
                        return;
                    } else {
                        throw new Error('Fallback merge failed: ' + fallbackResult.error);
                    }
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
                console.log('[MERGE] Merged items to set in Redux:', mergedItems);
                
                dispatch(setCartItems(mergedItems));
                console.log('[MERGE] ✅ Redux state updated with', mergedItems.length, 'items');
                
                // 🎯 STEP 3: Don't clean up localStorage here - do it after both merges
                console.log('[MERGE] ✅ Cart merge completed successfully');
                console.log('[MERGE] Summary:', {
                    anonymousItemsCount: mergeResult.anonymous_items_count,
                    authenticatedItemsCount: mergeResult.authenticated_items_count,
                    mergedItemsCount: mergeResult.merged_items_count,
                    timestamp: mergeResult.timestamp
                });
                
            } catch (error) {
                console.error('[MERGE] ❌ Cart merge failed:', error);
                // Don't clean up localStorage here - let the main function handle it
                throw error;
            }
        };
        
        // 🎯 DATABASE-FIRST SEARCH PREFERENCES MERGE FUNCTION
        const performSearchPreferencesMerge = async (anonymousUserId, authenticatedUserId) => {
            try {
                console.log('[SEARCH MERGE] 🚀 Starting database-first search preferences merge...');
                console.log('[SEARCH MERGE] Anonymous user ID:', anonymousUserId);
                console.log('[SEARCH MERGE] Authenticated user ID:', authenticatedUserId);
                
                // 🎯 PHASE 1 DEBUG: Check what's in localStorage for anonymous user
                const storedAnonymousId = localStorage.getItem('anonymousUserIdForMerge');
                console.log('[SEARCH MERGE] 🔍 Debug - localStorage anonymous ID:', storedAnonymousId);
                console.log('[SEARCH MERGE] 🔍 Debug - Expected anonymous ID:', anonymousUserId);
                console.log('[SEARCH MERGE] 🔍 Debug - IDs match:', storedAnonymousId === anonymousUserId);
                
                // 🎯 STEP 1: Use database function to perform complete merge
                console.log('[SEARCH MERGE] 🔍 Step 1: Calling database merge function...');
                
                // 🎯 PHASE 1 DEBUG: Check what search preferences exist for anonymous user
                try {
                    const { data: anonymousPrefs, error: anonymousPrefsError } = await supabase
                        .from('SearchPreferences')
                        .select('*')
                        .eq('supabase_user_id', anonymousUserId);
                    
                    console.log('[SEARCH MERGE] 🔍 Debug - Anonymous user search preferences:', {
                        data: anonymousPrefs,
                        error: anonymousPrefsError,
                        count: anonymousPrefs?.length || 0
                    });
                } catch (debugError) {
                    console.log('[SEARCH MERGE] 🔍 Debug - Failed to check anonymous preferences:', debugError);
                }
                
                const { data: mergeResult, error: mergeError } = await supabase
                    .rpc('merge_search_preferences', {
                        p_anonymous_user_id: anonymousUserId,
                        p_authenticated_user_id: authenticatedUserId
                    });
                
                if (mergeError) {
                    console.error('[SEARCH MERGE] ❌ Error calling merge function:', mergeError);
                    throw new Error('Failed to merge search preferences: ' + mergeError.message);
                }
                
                console.log('[SEARCH MERGE] ✅ Database merge result:', mergeResult);
                
                // 🎯 STEP 2: Update Redux state with merged preferences
                console.log('[SEARCH MERGE] 🔄 Step 2: Updating Redux state...');
                console.log('[SEARCH MERGE] Merge result:', mergeResult);
                if (mergeResult && Object.keys(mergeResult).length > 0) {
                    // 🛡️ FIXED: Update both search term and allergens in Redux state
                    const mergedSearchTerm = mergeResult.search_term || '';
                    const rawMergedAllergens = mergeResult.selectedallergens || [];
                    
                    // 🛡️ FIXED: Properly map allergens to camelCase format
                    const { mapArrayToCamelCase } = await import('../../utils/allergenMappings');
                    const mergedAllergens = mapArrayToCamelCase(rawMergedAllergens);
                    
                    console.log('[SEARCH MERGE] Raw merged allergens:', rawMergedAllergens);
                    console.log('[SEARCH MERGE] Mapped merged allergens:', mergedAllergens);
                    console.log('[SEARCH MERGE] Updating Redux with merged search term:', mergedSearchTerm);
                    
                    // Update search term in Redux
                    dispatch(setSearchTerm(mergedSearchTerm));
                    
                    // Update searchbar value in Redux (for UI consistency)
                    dispatch(setSearchbarValue(mergedSearchTerm));
                    
                    // 🎯 PHASE 1 FIX: Force immediate UI sync after Redux update
                    console.log('[SEARCH MERGE] 🔄 Forcing immediate UI sync for search term:', mergedSearchTerm);
                    
                    // Add a small delay to ensure Redux state is updated before continuing
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    console.log('[SEARCH MERGE] ✅ Redux state updated, UI should sync shortly');
                    
                    // Update search preferences in Redux
                    dispatch(setSelectedAllergens(mergedAllergens));
                    
                    // 🛡️ FIXED: Update allergies state to match (proper format)
                    const { setAllergies } = await import('../../redux/allergiesSlice');
                    const newAllergies = {};
                    mergedAllergens.forEach(allergen => {
                        newAllergies[allergen] = true;
                    });
                    dispatch(setAllergies(newAllergies));
                    
                    console.log('[SEARCH MERGE] Updated allergies state:', newAllergies);
                    
                    // 🛡️ ADDED: Trigger search after merge to load products
                    if (mergedSearchTerm && mergedSearchTerm.trim() !== '') {
                        console.log('[SEARCH MERGE] Triggering search after merge for term:', mergedSearchTerm);
                        try {
                            const { searchProductsUnified } = await import('../../utils/supabaseQueries');
                            const { setProducts } = await import('../../redux/productSlice');
                            const { addRecipes } = await import('../../redux/recipeSlice');
                            const { searchRecipesFromSupabasePure } = await import('../../utils/supabaseQueries');
                            
                            // Search for products with merged term and allergens
                            const productResponse = await searchProductsUnified({
                                searchTerm: mergedSearchTerm,
                                allergens: mergedAllergens,
                                page: 1,
                                limit: 20,
                                userType: 'authenticated',
                                includeCount: true
                            });
                            
                            // Search for recipes with merged term
                            const recipeResponse = await searchRecipesFromSupabasePure({
                                search: mergedSearchTerm,
                                excludeIngredients: [],
                                page: 1,
                                limit: 10,
                                includeCount: true
                            });
                            
                            // Update Redux with search results
                            dispatch(setProducts(productResponse));
                            dispatch(addRecipes(recipeResponse));
                            
                            console.log('[SEARCH MERGE] ✅ Search triggered after merge:', {
                                products: productResponse.products ? productResponse.products.length : productResponse.length,
                                recipes: recipeResponse.recipes ? recipeResponse.recipes.length : recipeResponse.length,
                                searchTerm: mergedSearchTerm,
                                allergens: mergedAllergens
                            });
                        } catch (error) {
                            console.warn('[SEARCH MERGE] ⚠️ Failed to trigger search after merge:', error);
                        }
                    } else {
                        console.log('[SEARCH MERGE] No search term to trigger search for');
                    }
                    
                    console.log('[SEARCH MERGE] ✅ Redux state updated with merged search term and allergens');
                } else {
                    console.log('[SEARCH MERGE] No merge result to update Redux with');
                }
                
                // 🎯 STEP 3: Don't clean up localStorage here - do it after both merges
                console.log('[SEARCH MERGE] ✅ Search preferences merge completed successfully');
                console.log('[SEARCH MERGE] Summary:', {
                    searchTerm: mergeResult?.search_term || '',
                    allergenCount: mergeResult?.selectedallergens?.length || 0,
                    timestamp: mergeResult?.updatedAt || new Date().toISOString()
                });
                
            } catch (error) {
                console.error('[SEARCH MERGE] ❌ Search preferences merge failed:', error);
                // Don't clean up localStorage here - let the main function handle it
                // Don't throw error - search preferences merge failure shouldn't break auth flow
            }
        };
        
        handleAuthCallback();
    }, [navigate, dispatch]);

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