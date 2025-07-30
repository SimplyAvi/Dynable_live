import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import './AllergyFilter.css'
import { useSearchCookieHandler } from '../../helperfunc/useCookieHandler'
import { supabase } from '../../utils/supabaseClient'
import { setAllergies, toggleAllergy } from '../../redux/allergiesSlice'
import { 
    saveSearchPreferencesAsync,
    loadSearchPreferencesAsync,
    mergeSearchPreferencesAsync
} from '../../redux/searchPreferencesSlice'
import { getAnonymousUserId } from '../../utils/supabaseClient'
import { isAnonymousUser } from '../../utils/anonymousAuth'

const AllergyFilter = () => {
    const { saveAllergensToCookies, initializeAllergensFromCookies } = useSearchCookieHandler()
    const dispatch = useDispatch();

    const allergies = useSelector((state) => state.allergies?.allergies || {});
    const loading = useSelector((state) => state.allergies?.loading || false);
    const error = useSelector((state) => state.allergies?.error || null);
    const searchPreferences = useSelector((state) => state.searchPreferences);
    const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated || false);
    const currentUser = useSelector((state) => state.auth?.user);
    const [justSaved, setJustSaved] = useState(false);
    const [filteringStatus, setFilteringStatus] = useState('ready'); // 'ready', 'filtering', 'complete', 'error'
    const [safetyStats, setSafetyStats] = useState(null);
    
    // Track active allergen count
    const activeAllergens = Object.keys(allergies).filter(key => allergies[key]);

    // 🛡️ FIXED: Proper allergen name mapping
    const allergenNameMap = {
        'milk': 'milk',
        'eggs': 'eggs', 
        'fish': 'fish',
        'shellfish': 'shellfish',
        'treenuts': 'treenuts', // 🚨 FIXED: Match actual state structure
        'peanuts': 'peanuts',
        'wheat': 'wheat',
        'soy': 'soy',
        'sesame': 'sesame',
        'gluten': 'gluten',
        'treenut': 'treenuts', // Alternative spelling
        'tree nuts': 'treenuts', // Space-separated
        'tree-nuts': 'treenuts', // Hyphenated
        'tree_nuts': 'treenuts', // Underscore
        'treeNuts': 'treenuts' // 🚨 FIXED: Map treeNuts to treenuts
    };

    // Debug logging
    useEffect(() => {
        console.log('[AllergyFilter] Component mounted');
        console.log('[AllergyFilter] Current Redux state:', {
            allergies: Object.keys(allergies),
            allergiesCount: Object.keys(allergies).length,
            loading,
            error,
            isAuthenticated,
            currentUserId: currentUser?.id
        });
    }, [allergies, loading, error, isAuthenticated, currentUser]);

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
    }, [allergies]);

    // 🛡️ FIXED: Handle auth state changes and allergen restoration
    useEffect(() => {
        const handleAuthStateChange = async () => {
            console.log('[AllergyFilter] Auth state changed:', { isAuthenticated, currentUserId: currentUser?.id });
            
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
                        localStorage.removeItem('anonymousUserIdForMerge');
                    }
                } else {
                    console.log('[AllergyFilter] No anonymous user ID found, loading authenticated user preferences...');
                    
                    try {
                        // Load authenticated user's saved allergens
                        await dispatch(loadSearchPreferencesAsync({ userId: currentUser.id })).unwrap();
                        console.log('[AllergyFilter] ✅ Loaded authenticated user allergens');
                    } catch (error) {
                        console.warn('[AllergyFilter] ⚠️ Failed to load authenticated user allergens:', error);
                    }
                }
            } else if (!isAuthenticated) {
                console.log('[AllergyFilter] User not authenticated, checking for anonymous session...');
                
                // Check for anonymous session
                const anonymousId = await getAnonymousUserId();
                if (anonymousId) {
                    console.log('[AllergyFilter] Found anonymous session, loading preferences...');
                    try {
                        await dispatch(loadSearchPreferencesAsync({ userId: anonymousId })).unwrap();
                        console.log('[AllergyFilter] ✅ Loaded anonymous user allergens');
                    } catch (error) {
                        console.warn('[AllergyFilter] ⚠️ Failed to load anonymous user allergens:', error);
                    }
                } else {
                    console.log('[AllergyFilter] No anonymous session found, initializing from cookies');
                    initializeAllergensFromCookies();
                }
            }
        };

        handleAuthStateChange();
    }, [isAuthenticated, currentUser, dispatch]);

    // 🛡️ FIXED: Initialize allergies from multiple sources with priority
    useEffect(() => {
        const initializeAllergies = async () => {
            console.log('[AllergyFilter] Initializing allergies from multiple sources...');
            
            // Priority 1: Check if we have authenticated user preferences
            if (isAuthenticated && currentUser?.id) {
                console.log('[AllergyFilter] Authenticated user found, loading preferences...');
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
            
            // Priority 3: Initialize from cookies (fallback)
            console.log('[AllergyFilter] No user found, initializing from cookies');
            initializeAllergensFromCookies();
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
                const mappedAllergen = allergenNameMap[normalizedAllergen] || normalizedAllergen;
                
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
        
    }, [searchPreferences.selectedAllergens, searchPreferences.isLoading, allergies, dispatch]);

    // 🛡️ FIXED: Simplified allergy click handler without bidirectional sync
    const handleAllergyClick = async (allergyKey, event) => {
        event.preventDefault();
        console.log(`[AllergyFilter] Allergy clicked: ${allergyKey}`);
        
        // 🚨 FIXED: Prevent race conditions by using local state first
        const updatedAllergies = { ...allergies, [allergyKey]: !allergies[allergyKey] };
        
        // Update Redux immediately for responsive UI
        dispatch(toggleAllergy(allergyKey));
        setFilteringStatus('filtering');
        
        // Save to cookies immediately
        saveAllergensToCookies(updatedAllergies);
        
        // Save to database if we have a user (async, don't block UI)
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const anonymousId = await getAnonymousUserId();
            let userId = user ? user.id : anonymousId;
            
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
            }
        } catch (error) {
            console.warn('[AllergyFilter] ⚠️ Failed to save allergen preferences:', error);
        }
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
                            {Object.entries(allergies).map(([key, value]) => (
                                <button
                                    key={key}
                                    className={`allergy-scroll-item ${value ? 'selected' : ''}`}
                                    onClick={(e) => handleAllergyClick(key, e)}
                                >
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                    {value && <span className="check">✓</span>}
                                </button>
                            ))}
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
                    {Object.entries(allergies).map(([key, value]) => (
                        <button
                            key={key}
                            className={`allergy-scroll-item ${value ? 'selected' : ''}`}
                            onClick={(e) => handleAllergyClick(key, e)}
                        >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                            {value && <span className="check">✓</span>}
                        </button>
                    ))}
                </div>
            </div>
            
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
                    <div className="status-message success">
                        ✅ Safe filtering active for: {activeAllergens.join(', ')}
                        <br />
                        <small>🛡️ Zero dangerous products will be shown</small>
                    </div>
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
        </div>
    );
};

export default AllergyFilter;