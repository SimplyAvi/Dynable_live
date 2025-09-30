import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleAllergy, clearAllergies, setAllergies, fetchAllergensPure } from '../../redux/allergiesSlice';
import { setSelectedAllergens, loadSearchPreferencesAsync, mergeSearchPreferencesAsync, saveSearchPreferencesAsync } from '../../redux/searchPreferencesSlice';
import { saveAllergensToCookies } from '../../utils/cookieUtils';
import { mapToDatabaseFormat } from '../../utils/allergenMappings'; // 🎯 ADDED: Single source of truth
import { getAnonymousUserId, supabase } from '../../utils/supabaseClient';
import { saveCustomAllergen, loadCustomAllergens, removeCustomAllergen, isUserAuthenticated } from '../../utils/customAllergenAPI';
import { 
    getUserTier, 
    canAddCustomAllergen, 
    validateAllergenToggle,
    getTierDisplayName,
    logTierAction 
} from '../../utils/userTierUtils';
import { loadUserRoleFromDatabase, shouldRefreshUserRole } from '../../utils/loadUserRoleFromDatabase';
import { updateUser } from '../../redux/authSlice';
import CustomAllergenModal from '../CustomAllergenModal/CustomAllergenModal';
import './AllergyFilter.css';

const AllergyFilter = ({ isSearching = false }) => {
    const dispatch = useDispatch();
    const allergies = useSelector((state) => state.allergies?.allergies || {});
    const searchPreferences = useSelector((state) => state.searchPreferences);
    const loading = useSelector((state) => state.allergies?.loading || false);
    const error = useSelector((state) => state.allergies?.error || null);
    const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated || false);
    const currentUser = useSelector((state) => state.auth?.user || null);

    const [filteringStatus, setFilteringStatus] = useState('ready');
    const [safetyStats, setSafetyStats] = useState(null);
    const [justSaved, setJustSaved] = useState(false);
    
    // 🚀 NEW: Custom allergen functionality
    const [customAllergens, setCustomAllergens] = useState({});
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [userAuthenticated, setUserAuthenticated] = useState(false);
    
    // Track active allergen count
    const activeAllergens = Object.keys(allergies).filter(key => allergies[key]);

    // 🎯 REMOVED: Redundant allergenNameMap (now using single source of truth)
    // const allergenNameMap = { ... } - REMOVED

    // 🚀 NEW: Load user role from database and custom allergens
    useEffect(() => {
        const loadUserData = async () => {
            const authenticated = await isUserAuthenticated();
            setUserAuthenticated(authenticated);
            
            if (authenticated && currentUser?.email) {
                try {
                    // First, refresh user role from database if needed
                    console.log('[AllergyFilter] Checking if user role needs refresh for:', currentUser);
                    if (shouldRefreshUserRole(currentUser)) {
                        console.log('[AllergyFilter] ✅ Refreshing user role from database...');
                        await loadUserRoleFromDatabase(currentUser.email, dispatch, updateUser);
                    } else {
                        console.log('[AllergyFilter] ⏭️ User role is up to date, skipping refresh');
                    }
                    
                    // Then load custom allergens
                    console.log('[AllergyFilter] Loading custom allergens for authenticated user');
                    const customAllergensData = await loadCustomAllergens();
                    
                    // Convert custom allergens array to object format for consistency
                    const customAllergensObj = {};
                    customAllergensData.forEach(allergen => {
                        customAllergensObj[allergen.name] = true; // Start as toggled on
                    });
                    
                    setCustomAllergens(customAllergensObj);
                    console.log('[AllergyFilter] Loaded custom allergens:', customAllergensObj);
                } catch (error) {
                    console.error('[AllergyFilter] Error loading user data:', error);
                    setCustomAllergens({});
                }
            }
        };
        
        loadUserData();
    }, [isAuthenticated, currentUser?.email, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debug logging
    useEffect(() => {
        console.log('[AllergyFilter] Component mounted');
        console.log('[AllergyFilter] Current Redux state:', {
            allergies: Object.keys(allergies),
            allergiesCount: Object.keys(allergies).length,
            loading,
            error,
            isAuthenticated,
            currentUserId: currentUser?.id,
            customAllergensCount: Object.keys(customAllergens).length
        });
    }, [allergies, loading, error, isAuthenticated, currentUser, customAllergens]);

    // Update filtering status when allergens change
    useEffect(() => {
        if (activeAllergens.length > 0) {
            setFilteringStatus('filtering');
            // Simulate filtering completion (replace with actual filtering logic)
            setTimeout(() => setFilteringStatus('complete'), 1000);
        } else {
            setFilteringStatus('ready');
            setSafetyStats(null);
        }
    }, [allergies]); // eslint-disable-line react-hooks/exhaustive-deps

    // 🛡️ FIXED: Handle auth state changes and allergen restoration
    useEffect(() => {
        const handleAuthStateChange = async () => {
            console.log('[AllergyFilter] Auth state changed:', { isAuthenticated, currentUserId: currentUser?.id });
            
            // 🎯 NEW: Clear custom allergens on logout
            if (!isAuthenticated) {
                console.log('[AllergyFilter] User logged out, clearing custom allergens');
                setCustomAllergens({});
                setUserAuthenticated(false);
                return;
            }
            
            if (isAuthenticated && currentUser?.id) {
                console.log('[AllergyFilter] User authenticated, checking for allergen merge...');
                
                // Check if we have an anonymous user ID for merging
                const anonymousUserId = localStorage.getItem('anonymousUserIdForMerge');
                
                if (anonymousUserId && anonymousUserId !== currentUser.id) {
                    console.log('[AllergyFilter] Found anonymous user ID for merge:', anonymousUserId);
                    
                    try {
                        // 🛡️ FIXED: Merge allergens from anonymous to authenticated user
                        console.log('[AllergyFilter] Merging allergens from anonymous to authenticated user...');
                        await dispatch(mergeSearchPreferencesAsync({
                            anonymousUserId,
                            authenticatedUserId: currentUser.id
                        })).unwrap();
                        
                        console.log('[AllergyFilter] ✅ Allergen merge completed');
                        localStorage.removeItem('anonymousUserIdForMerge');
                        
                    } catch (error) {
                        console.warn('[AllergyFilter] ⚠️ Allergen merge failed:', error);
                    }
                }
                
                // 🛡️ FIXED: Don't load preferences here - let GoogleCallback handle the merge
                // This prevents conflicts with the merge process
                console.log('[AllergyFilter] Skipping preference load - letting GoogleCallback handle merge');
                
                // 🛡️ FIXED: Ensure all available allergens are loaded when user logs in
                // This prevents the issue where only toggled allergens are shown
                if (!Object.keys(allergies).length || Object.keys(allergies).length < 10) {
                    console.log('[AllergyFilter] Re-fetching all available allergens for authenticated user...');
                    await dispatch(fetchAllergensPure());
                }
            }
        };

        handleAuthStateChange();
    }, [isAuthenticated, currentUser, dispatch, allergies]);

    // 🛡️ FIXED: Initialize allergies from multiple sources with priority
    useEffect(() => {
        const initializeAllergies = async () => {
            console.log('[AllergyFilter] Initializing allergies from multiple sources...');
            
            // Priority 1: Check if we have authenticated user preferences
            if (isAuthenticated && currentUser?.id) {
                console.log('[AllergyFilter] Authenticated user found, checking for merge process...');
                
                // Check if we're in the middle of a merge process
                const isMerging = localStorage.getItem('anonymousUserIdForMerge');
                if (isMerging) {
                    console.log('[AllergyFilter] Merge process detected, skipping initialization');
                    return;
                }
                
                console.log('[AllergyFilter] No merge process, loading authenticated user preferences...');
                try {
                    await dispatch(loadSearchPreferencesAsync({ userId: currentUser.id })).unwrap();
                    console.log('[AllergyFilter] ✅ Loaded authenticated user preferences');
                    return;
                } catch (error) {
                    console.warn('[AllergyFilter] ⚠️ Failed to load authenticated preferences:', error);
                }
            }
            
            // Priority 2: Check for anonymous user preferences
            const anonymousId = await getAnonymousUserId();
            if (anonymousId) {
                console.log('[AllergyFilter] Anonymous user found, loading preferences...');
                try {
                    await dispatch(loadSearchPreferencesAsync({ userId: anonymousId })).unwrap();
                    console.log('[AllergyFilter] ✅ Loaded anonymous user preferences');
                    return;
                } catch (error) {
                    console.warn('[AllergyFilter] ⚠️ Failed to load anonymous preferences:', error);
                }
            }
            
            // Priority 3: Initialize from localStorage (fallback)
            console.log('[AllergyFilter] No user found, initializing from localStorage');
            const storedAllergens = localStorage.getItem('selectedAllergens');
            if (storedAllergens) {
                try {
                    const parsedAllergens = JSON.parse(storedAllergens);
                    console.log('[AllergyFilter] Found stored allergens in localStorage:', parsedAllergens);
                    
                    // Convert stored allergens to allergies format
                    const newAllergies = { ...allergies };
                    parsedAllergens.forEach(allergen => {
                        const normalizedAllergen = allergen.toLowerCase().replace(/[\s\-_]+/g, '');
                        const mappedAllergen = mapToDatabaseFormat(normalizedAllergen);
                        if (newAllergies.hasOwnProperty(mappedAllergen)) {
                            newAllergies[mappedAllergen] = true;
                        } else {
                            newAllergies[mappedAllergen] = true;
                        }
                    });
                    
                    dispatch(setAllergies(newAllergies));
                    dispatch(setSelectedAllergens(parsedAllergens));
                    console.log('[AllergyFilter] ✅ Allergens restored from localStorage');
                } catch (error) {
                    console.warn('[AllergyFilter] ⚠️ Error parsing stored allergens:', error);
                }
            } else {
                console.log('[AllergyFilter] No stored allergens found in localStorage');
            }
        };

        if (!Object.keys(allergies).length) {
            initializeAllergies();
        } else {
            console.log('[AllergyFilter] Allergies already in Redux:', Object.keys(allergies));
        }
    }, [dispatch, isAuthenticated, currentUser]); // Include auth state in dependencies

    // 🛡️ FIXED: One-way sync from search preferences to allergies (ONLY on initial load)
    const hasInitializedRef = useRef(false);
    
    useEffect(() => {
        console.log('[AllergyFilter] Search preferences changed:', searchPreferences.selectedAllergens);
        console.log('[AllergyFilter] Current allergies state:', allergies);
        console.log('[AllergyFilter] Search preferences loading state:', searchPreferences.isLoading);
        
        // Don't sync if search preferences are still loading
        if (searchPreferences.isLoading) {
            console.log('[AllergyFilter] Search preferences still loading, skipping sync');
            return;
        }
        
        // Don't sync if search preferences are undefined or null
        if (!searchPreferences.selectedAllergens) {
            console.log('[AllergyFilter] No search preferences allergens to sync');
            return;
        }
        
        // 🚨 FIXED: Check if we need to sync (only if allergies are all false and we have preferences)
        const hasActiveAllergies = Object.values(allergies).some(value => value === true);
        const hasPreferences = searchPreferences.selectedAllergens.length > 0;
        
        // 🛡️ FIXED: Allow sync when we have preferences but no active allergies
        if (hasActiveAllergies && hasInitializedRef.current) {
            console.log('[AllergyFilter] Allergies already active, skipping sync to prevent conflicts');
            return;
        }
        
        // 🛡️ FIXED: Always sync when we have preferences and no active allergies
        if (hasPreferences && !hasActiveAllergies) {
            console.log('[AllergyFilter] Syncing search preferences to allergies (preferences found, no active allergies)');
            
            // Start with current allergies state (preserve existing structure)
            const newAllergies = { ...allergies };
            
            // Map search preferences allergens to allergies format
            searchPreferences.selectedAllergens.forEach(allergen => {
                const normalizedAllergen = allergen.toLowerCase().replace(/[\s\-_]+/g, '');
                const mappedAllergen = mapToDatabaseFormat(normalizedAllergen); // Use the single source of truth
                
                // 🚨 FIXED: Check if the mapped allergen exists in the allergies structure
                if (newAllergies.hasOwnProperty(mappedAllergen)) {
                    newAllergies[mappedAllergen] = true;
                    console.log(`[AllergyFilter] Mapped "${allergen}" to "${mappedAllergen}" and set to true`);
                } else {
                    console.warn(`[AllergyFilter] Unknown allergen in preferences: "${allergen}" (mapped to "${mappedAllergen}")`);
                    // 🛡️ FIXED: Add the allergen to the structure if it doesn't exist
                    newAllergies[mappedAllergen] = true;
                    console.log(`[AllergyFilter] Added missing allergen "${mappedAllergen}" to structure`);
                }
            });
            
            console.log('[AllergyFilter] Final allergies state:', newAllergies);
            dispatch(setAllergies(newAllergies));
            hasInitializedRef.current = true;
            
            // 🚨 FIXED: Search will be triggered automatically by Homepage component
            console.log('[AllergyFilter] Allergens restored, search will be triggered by Homepage');
        }
        
    }, [searchPreferences.selectedAllergens, searchPreferences.isLoading, allergies, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    // 🛡️ FIXED: Simplified allergy click handler with tier validation
    const handleAllergyClick = async (allergyKey, event) => {
        event.preventDefault();
        console.log(`[ALLERGEN FLOW] 🎯 Allergy clicked: ${allergyKey}`);
        console.log(`[ALLERGEN FLOW] 📊 Current allergies state:`, allergies);
        
        // 🚀 NEW: Tier-based validation
        const authState = { user: currentUser, isAuthenticated };
        const currentAllergenCount = Object.values(allergies).filter(Boolean).length;
        const isTogglingOn = !allergies[allergyKey];
        
        // Validate allergen toggle based on user tier
        const validation = validateAllergenToggle(authState, currentAllergenCount, isTogglingOn);
        
        if (!validation.allowed) {
            console.log(`[TIER_VALIDATION] ❌ Allergen toggle blocked:`, validation.reason);
            logTierAction('allergen_toggle_blocked', getUserTier(authState), {
                allergyKey,
                currentCount: currentAllergenCount,
                reason: validation.reason
            });
            
            // Don't show alert - button will be visually disabled instead
            return;
        }
        
        // Log successful toggle
        logTierAction('allergen_toggled', getUserTier(authState), {
            allergyKey,
            isTogglingOn,
            newCount: currentAllergenCount + (isTogglingOn ? 1 : -1)
        });
        
        // 🚨 FIXED: Prevent race conditions by using local state first
        const updatedAllergies = { ...allergies, [allergyKey]: !allergies[allergyKey] };
        console.log(`[ALLERGEN FLOW] 🔄 Updated allergies state:`, updatedAllergies);
        
        // Update Redux immediately for responsive UI
        console.log(`[ALLERGEN FLOW] 📤 Dispatching toggleAllergy(${allergyKey}) to Redux`);
        dispatch(toggleAllergy(allergyKey));
        setFilteringStatus('filtering');
        
        // 🛡️ FIXED: Immediately update searchPreferences.selectedAllergens for perfect synchronization
        const selectedAllergens = Object.keys(updatedAllergies).filter(key => updatedAllergies[key]);
        console.log(`[ALLERGEN FLOW] 📋 Selected allergens array:`, selectedAllergens);
        console.log(`[ALLERGEN FLOW] 📤 Dispatching setSelectedAllergens(${JSON.stringify(selectedAllergens)}) to Redux`);
        
        // Dispatch to searchPreferences to ensure Homepage.js gets the update immediately
        dispatch(setSelectedAllergens(selectedAllergens));
        
        // 🎯 DEBUG: Verify Redux state after dispatch
        setTimeout(() => {
            const state = window.store?.getState();
            console.log('[ALLERGEN FLOW] 🔍 Verified Redux state after dispatch:', {
                selectedAllergensInRedux: state?.searchPreferences?.selectedAllergens,
                match: JSON.stringify(selectedAllergens) === JSON.stringify(state?.searchPreferences?.selectedAllergens)
            });
        }, 100);
        
        // Save to cookies immediately
        saveAllergensToCookies(updatedAllergies);
        
        // Save to database if we have a user (async, don't block UI)
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const anonymousId = await getAnonymousUserId();
            let userId = user ? user.id : anonymousId;
            
            // 🛡️ FIXED: Add retry logic if no user ID is available immediately
            if (!userId) {
                console.log('[AllergyFilter] No user ID available, waiting for anonymous session...');
                // Wait a bit for anonymous session to be created
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Try again to get user ID
                const { data: { user: retryUser } } = await supabase.auth.getUser();
                const retryAnonymousId = await getAnonymousUserId();
                userId = retryUser ? retryUser.id : retryAnonymousId;
                
                if (!userId) {
                    console.warn('[AllergyFilter] ⚠️ Still no user ID available after retry');
                } else {
                    console.log('[AllergyFilter] ✅ User ID obtained after retry:', userId);
                }
            }
            
            if (userId) {
                const sendAllergens = Object.keys(updatedAllergies)
                    .filter(key => updatedAllergies[key])
                    .map(key => key.toLowerCase());
                
                await dispatch(saveSearchPreferencesAsync({
                    allergens: sendAllergens,
                    userId: userId
                })).unwrap();
                
                setJustSaved(true);
                setTimeout(() => setJustSaved(false), 2000);
                console.log('[AllergyFilter] ✅ Allergen preferences saved to database');
            } else {
                console.warn('[AllergyFilter] ⚠️ No user ID available for saving preferences');
                // 🛡️ FIXED: Save to localStorage as fallback
                try {
                    localStorage.setItem('fallbackAllergenPreferences', JSON.stringify({
                        allergens: Object.keys(updatedAllergies).filter(key => updatedAllergies[key]),
                        timestamp: new Date().toISOString()
                    }));
                    console.log('[AllergyFilter] ✅ Allergen preferences saved to localStorage as fallback');
                } catch (localStorageError) {
                    console.warn('[AllergyFilter] ⚠️ Failed to save to localStorage:', localStorageError);
                }
            }
        } catch (error) {
            console.warn('[AllergyFilter] ⚠️ Failed to save allergen preferences:', error);
            // 🛡️ FIXED: Save to localStorage as fallback on error
            try {
                localStorage.setItem('fallbackAllergenPreferences', JSON.stringify({
                    allergens: Object.keys(updatedAllergies).filter(key => updatedAllergies[key]),
                    timestamp: new Date().toISOString()
                }));
                console.log('[AllergyFilter] ✅ Allergen preferences saved to localStorage as fallback after error');
            } catch (localStorageError) {
                console.warn('[AllergyFilter] ⚠️ Failed to save to localStorage after error:', localStorageError);
            }
        }
    };
    
    // 🚀 NEW: Handle custom allergen save
    const handleSaveCustomAllergen = async (customAllergen) => {
        try {
            console.log('[AllergyFilter] Saving custom allergen:', customAllergen);
            
            const result = await saveCustomAllergen(customAllergen);
            
            if (result.success) {
                // Add to custom allergens state only (don't add to main allergies state)
                const updatedCustomAllergens = { ...customAllergens, [customAllergen.name]: true };
                setCustomAllergens(updatedCustomAllergens);
                
                console.log('[AllergyFilter] Successfully saved custom allergen');
                return { success: true };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('[AllergyFilter] Error saving custom allergen:', error);
            throw error;
        }
    };

    // 🚀 NEW: Handle custom allergen clear
    const handleClearCustomAllergen = async (allergenName) => {
        try {
            console.log('[AllergyFilter] Clearing custom allergen:', allergenName);
            console.log('[AllergyFilter] Current auth state before clear:', { 
                isAuthenticated, 
                currentUser: currentUser?.role,
                userId: currentUser?.id 
            });
            
            // Remove from database first
            const result = await removeCustomAllergen(allergenName);
            
            if (result.success) {
                // Remove from custom allergens state only (don't touch main allergies state)
                const updatedCustomAllergens = { ...customAllergens };
                delete updatedCustomAllergens[allergenName];
                setCustomAllergens(updatedCustomAllergens);
                
                console.log('[AllergyFilter] Custom allergen cleared from database and local state');
                console.log('[AllergyFilter] Auth state after clear:', { 
                    isAuthenticated, 
                    currentUser: currentUser?.role,
                    userId: currentUser?.id 
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('[AllergyFilter] Error clearing custom allergen:', error);
            console.log('[AllergyFilter] Auth state after error:', { 
                isAuthenticated, 
                currentUser: currentUser?.role,
                userId: currentUser?.id 
            });
            alert('Failed to clear custom allergen: ' + error.message);
        }
    };
    
    // 🚀 NEW: Check if allergen button should be disabled
    const isAllergenButtonDisabled = (allergyKey, isTogglingOn) => {
        const authState = { user: currentUser, isAuthenticated };
        const currentAllergenCount = Object.values(allergies).filter(Boolean).length;
        
        // If toggling off, never disable
        if (!isTogglingOn) return false;
        
        // Check tier validation
        const validation = validateAllergenToggle(authState, currentAllergenCount, isTogglingOn);
        return !validation.allowed;
    };

    // 🚀 NEW: Handle custom allergen modal open with tier validation
    const handleOpenCustomModal = () => {
        const authState = { user: currentUser, isAuthenticated };
        
        if (!userAuthenticated) {
            alert('Please log in to add custom allergens');
            return;
        }
        
        // Check if user can add custom allergens based on tier
        if (!canAddCustomAllergen(authState)) {
            const tier = getUserTier(authState);
            alert(`Custom allergens are available for Standard+ users. You are currently on ${getTierDisplayName(tier)} tier.`);
            logTierAction('custom_allergen_blocked', tier, { reason: 'insufficient_tier' });
            return;
        }
        
        logTierAction('custom_allergen_modal_opened', getUserTier(authState));
        setShowCustomModal(true);
    };

    // Show loading state
    if (loading) {
        return (
            <div className="allergy-filter">
                <div className="loading-message">
                    🔄 Loading allergen filters...
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="allergy-filter">
                <div className="error-message">
                    ⚠️ Error loading allergens: {error}
                </div>
                <div className="fallback-allergens">
                    <h4>Fallback Allergen Filters:</h4>
                    <div className="horizontal-scroll-container allergen-scroll-container">
                        <div className="horizontal-scroll">
                            {Object.entries(allergies).map(([key, value]) => {
                                const isDisabled = isAllergenButtonDisabled(key, !value);
                                return (
                                <button
                                    key={key}
                                        className={`allergy-scroll-item ${value ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                        onClick={(e) => !isDisabled && handleAllergyClick(key, e)}
                                        disabled={isDisabled}
                                        style={{
                                            opacity: isDisabled ? 0.4 : 1,
                                            cursor: isDisabled ? 'not-allowed' : 'pointer'
                                        }}
                                        title={isDisabled ? 'Upgrade to Standard tier for unlimited allergens' : ''}
                                >
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                    {value && <span className="check">✓</span>}
                                </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="allergy-filter">
            <h3>Filter by Allergens</h3>
            
            {/* Existing allergy toggles */}
            <div className="horizontal-scroll-container allergen-scroll-container">
                <div className="horizontal-scroll">
                    {(() => {
                        // Only use regular allergens for filtering (custom allergens are separate)
                        const regularAllergenEntries = Object.entries(allergies);
                        
                        // Separate toggled and non-toggled allergens
                        const toggledAllergens = regularAllergenEntries.filter(([key, value]) => value);
                        const nonToggledAllergens = regularAllergenEntries.filter(([key, value]) => !value);
                        
                        // Sort toggled allergens alphabetically
                        toggledAllergens.sort(([a], [b]) => a.localeCompare(b));
                        
                        // Sort non-toggled allergens alphabetically
                        nonToggledAllergens.sort(([a], [b]) => a.localeCompare(b));
                        
                        // Combine: toggled first, then non-toggled
                        const sortedAllergens = [...toggledAllergens, ...nonToggledAllergens];
                        
                        console.log('[AllergyFilter] Sorted regular allergens (custom allergens separate):', {
                            regular: regularAllergenEntries.length,
                            custom: Object.keys(customAllergens).length,
                            toggled: toggledAllergens.map(([key]) => key),
                            nonToggled: nonToggledAllergens.map(([key]) => key),
                            total: sortedAllergens.length
                        });
                        
                        return (
                            <>
                                {sortedAllergens.map(([key, value]) => {
                                    const isDisabled = isAllergenButtonDisabled(key, !value);
                                    const isSearchingDisabled = isSearching;
                                    const isFullyDisabled = isDisabled || isSearchingDisabled;
                                    
                                    return (
                        <button
                            key={key}
                                            className={`allergy-scroll-item ${value ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            onClick={(e) => !isFullyDisabled && handleAllergyClick(key, e)}
                                            disabled={isFullyDisabled}
                                            style={{
                                                opacity: isFullyDisabled ? (isDisabled ? 0.4 : 0.6) : 1,
                                                cursor: isFullyDisabled ? 'not-allowed' : 'pointer'
                                            }}
                                            title={isDisabled ? 'Upgrade to Standard tier for unlimited allergens' : 
                                                   isSearchingDisabled ? 'Searching...' : ''}
                        >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                            {value && <span className="check">✓</span>}
                                        </button>
                                    );
                                })}
                                
                                {/* 🚀 NEW: Blue plus button for adding custom allergens - Standard+ only */}
                                {userAuthenticated && canAddCustomAllergen({ user: currentUser, isAuthenticated }) && (
                                    <button
                                        className="allergy-scroll-item add-custom-allergen-btn"
                                        onClick={handleOpenCustomModal}
                                        style={{
                                            opacity: isSearching ? 0.6 : 1,
                                            cursor: isSearching ? 'not-allowed' : 'pointer'
                                        }}
                                        disabled={isSearching}
                                        title="Add custom allergen (Standard+ tier)"
                                    >
                                        <span className="plus-icon">+</span>
                                        <span className="add-text">Add</span>
                        </button>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>
            
            {/* 🎯 NEW: Custom Allergens Display Section (Separate from filtering) */}
            {Object.keys(customAllergens).length > 0 && (
                <div className="custom-allergens-section">
                    <h4>Your Custom Allergens</h4>
                    <div className="horizontal-scroll-container allergen-scroll-container">
                        <div className="horizontal-scroll">
                            {Object.entries(customAllergens).map(([allergenName, isActive]) => (
                                <button
                                    key={allergenName}
                                    className="allergy-scroll-item custom-allergen-item selected"
                                    onClick={() => handleClearCustomAllergen(allergenName)}
                                    title="Click to remove this custom allergen"
                                >
                                    {allergenName.charAt(0).toUpperCase() + allergenName.slice(1)}
                                    <span className="check">×</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* 🛡️ NEW: Safety status indicator */}
            <div className="safety-status">
                {filteringStatus === 'ready' && activeAllergens.length === 0 && (
                    <div className="status-message neutral">
                        🔍 Select allergens to filter products safely
                    </div>
                )}
                
                {filteringStatus === 'filtering' && (
                    <div className="status-message loading">
                        🔄 Applying bulletproof allergen filtering...
                    </div>
                )}
                
                {filteringStatus === 'complete' && activeAllergens.length > 0 && (
                    <>
                        {Object.keys(customAllergens).length > 0 && ( // Only show if user has custom allergens
                            <div className="status-message warning">
                                ⚠️ Deleting an allergen will permanently remove it from your profile
                            </div>
                        )}
                        <div className="status-message success">
                            ✅ Safe filtering active for: {activeAllergens.join(', ')}
                            <br />
                            <small>🛡️ Zero dangerous products will be shown</small>
                        </div>
                    </>
                )}
                
                
                {filteringStatus === 'error' && (
                    <div className="status-message error">
                        ⚠️ Filtering error - manual allergen checking required
                    </div>
                )}
                
                {safetyStats && (
                    <div className="safety-stats">
                        <small>
                            📊 {safetyStats.safeProducts} safe products found
                            {safetyStats.filteredOut > 0 && 
                                ` (${safetyStats.filteredOut} products filtered for safety)`
                            }
                        </small>
                    </div>
                )}
            </div>
            
            {/* Save status indicator */}
            {justSaved && (
                <div className="save-status">
                    ✅ Allergen preferences saved
                </div>
            )}
            
            {/* 🚀 NEW: Custom Allergen Modal */}
            <CustomAllergenModal
                isOpen={showCustomModal}
                onClose={() => setShowCustomModal(false)}
                onSave={handleSaveCustomAllergen}
            />
        </div>
    );
};

export default AllergyFilter;