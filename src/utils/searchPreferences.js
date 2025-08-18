/**
 * Search Preferences Database Functions
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Database-first search persistence following the same pattern as cart system
 * Supports anonymous and authenticated user search preferences
 */

import { supabase } from './supabaseClient';

/**
 * Save search preferences to database
 * @param {string} searchTerm - The search term
 * @param {Array} allergens - Array of selected allergens
 * @param {string} userId - User ID (anonymous or authenticated)
 * @returns {Promise<Object>} - Saved preferences object
 */
export const saveSearchPreferences = async (searchTerm, allergens, userId) => {
    try {
        console.log('[SEARCH PREFERENCES] Saving preferences:', { searchTerm, allergens, userId });
        
        const { data, error } = await supabase.rpc('save_search_preferences', {
            p_user_id: userId,
            p_search_term: searchTerm || '',
            p_allergens: allergens || []
        });
        
        if (error) {
            console.error('[SEARCH PREFERENCES] Error saving preferences:', error);
            throw new Error(`Failed to save search preferences: ${error.message}`);
        }
        
        console.log('[SEARCH PREFERENCES] ✅ Preferences saved successfully:', data);
        return data;
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES] ❌ Save preferences failed:', error);
        throw error;
    }
};

/**
 * Get search preferences from database
 * @param {string} userId - User ID (anonymous or authenticated)
 * @returns {Promise<Object>} - Search preferences object
 */
export const getSearchPreferences = async (userId) => {
    try {
        console.log('[SEARCH PREFERENCES] Getting preferences for user:', userId);
        
        const { data, error } = await supabase.rpc('get_search_preferences', {
            p_user_id: userId
        });
        
        if (error) {
            console.error('[SEARCH PREFERENCES] Error getting preferences:', error);
            throw new Error(`Failed to get search preferences: ${error.message}`);
        }
        
        console.log('[SEARCH PREFERENCES] ✅ Preferences retrieved:', data);
        return data;
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES] ❌ Get preferences failed:', error);
        throw error;
    }
};

/**
 * Merge search preferences (for login flow)
 * @param {string} anonymousUserId - Anonymous user ID
 * @param {string} authenticatedUserId - Authenticated user ID
 * @returns {Promise<Object>} - Merged preferences object
 */
export const mergeSearchPreferences = async (anonymousUserId, authenticatedUserId) => {
    try {
        console.log('🔄 [SEARCH PREFERENCES] Starting merge...');
        
        // Get anonymous user preferences
        const anonymousPreferences = await getSearchPreferences(anonymousUserId);
        const anonymousAllergens = anonymousPreferences?.selectedallergens || [];
        console.log('🔍 [SEARCH PREFERENCES] Anonymous allergens:', anonymousAllergens);
        
        // Get authenticated user preferences
        const authenticatedPreferences = await getSearchPreferences(authenticatedUserId);
        const authenticatedAllergens = authenticatedPreferences?.selectedallergens || [];
        console.log('🔍 [SEARCH PREFERENCES] Authenticated allergens:', authenticatedAllergens);
        
        // Merge allergens using OR logic
        const mergedAllergens = mergeAllergenArrays(anonymousAllergens, authenticatedAllergens);
        console.log('✅ [SEARCH PREFERENCES] Merged allergens:', mergedAllergens);
        
        // Save merged preferences to authenticated user
        const searchTerm = authenticatedPreferences?.search_term || anonymousPreferences?.search_term || '';
        const result = await saveSearchPreferences(searchTerm, mergedAllergens, authenticatedUserId);
        
        // Clean up anonymous preferences
        try {
            await clearSearchPreferences(anonymousUserId);
        } catch (cleanupError) {
            console.warn('⚠️ [SEARCH PREFERENCES] Cleanup failed:', cleanupError);
        }
        
        console.log('✅ [SEARCH PREFERENCES] Merge completed');
        return result;
        
    } catch (error) {
        console.error('❌ [SEARCH PREFERENCES] Merge failed:', error.message);
        throw error;
    }
};

/**
 * Merge allergen arrays using OR logic with anonymous priority
 * @param {Array} anonymousAllergens - Anonymous user allergens
 * @param {Array} authenticatedAllergens - Authenticated user allergens
 * @returns {Array} - Merged allergens array with anonymous priority
 */
function mergeAllergenArrays(anonymousAllergens, authenticatedAllergens) {
    console.log('[SEARCH PREFERENCES] Merging allergen arrays with anonymous priority...');
    console.log('[SEARCH PREFERENCES] Anonymous allergens:', anonymousAllergens);
    console.log('[SEARCH PREFERENCES] Authenticated allergens:', authenticatedAllergens);
    
    // 🎯 ANONYMOUS PRIORITY LOGIC: Anonymous selections take precedence
    // If anonymous user has made selections, use those as the base
    // Only fall back to authenticated allergens for items not selected by anonymous user
    
    const mergedSet = new Set();
    
    // 🎯 STEP 1: Add all anonymous allergens first (they take priority)
    anonymousAllergens.forEach(allergen => {
        mergedSet.add(allergen.toLowerCase());
    });
    
    // 🎯 STEP 2: Add authenticated allergens only if not already selected by anonymous
    // This ensures anonymous selections override authenticated selections
    authenticatedAllergens.forEach(allergen => {
        const normalizedAllergen = allergen.toLowerCase();
        if (!mergedSet.has(normalizedAllergen)) {
            // Only add if anonymous user hasn't already selected it
            mergedSet.add(normalizedAllergen);
        } else {
            console.log('[SEARCH PREFERENCES] Skipping authenticated allergen (anonymous priority):', allergen);
        }
    });
    
    const mergedArray = Array.from(mergedSet);
    console.log('[SEARCH PREFERENCES] Merged allergen array (anonymous priority):', mergedArray);
    
    return mergedArray;
}

/**
 * Clear search preferences (for logout)
 * @param {string} userId - User ID to clear preferences for
 * @returns {Promise<boolean>} - Success status
 */
export const clearSearchPreferences = async (userId) => {
    try {
        console.log('[SEARCH PREFERENCES] Clearing preferences for user:', userId);
        
        const { error } = await supabase.rpc('clear_search_preferences', {
            p_user_id: userId
        });
        
        if (error) {
            console.error('[SEARCH PREFERENCES] Error clearing preferences:', error);
            throw new Error(`Failed to clear search preferences: ${error.message}`);
        }
        
        console.log('[SEARCH PREFERENCES] ✅ Preferences cleared successfully');
        return true;
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES] ❌ Clear preferences failed:', error);
        throw error;
    }
};

/**
 * Save search preferences before authentication (like cart save)
 * @param {string} searchTerm - Current search term
 * @param {Array} allergens - Current selected allergens
 * @param {string} anonymousUserId - Anonymous user ID
 * @returns {Promise<Object>} - Save result
 */
export const saveSearchPreferencesBeforeAuth = async (searchTerm, allergens, anonymousUserId) => {
    try {
        console.log('[SEARCH PREFERENCES] Saving before auth:', { searchTerm, allergens, anonymousUserId });
        
        if (!anonymousUserId) {
            console.warn('[SEARCH PREFERENCES] No anonymous user ID, skipping save');
            return { success: false, error: 'No anonymous user ID' };
        }
        
        const result = await saveSearchPreferences(searchTerm, allergens, anonymousUserId);
        
        return { success: true, data: result };
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES] ❌ Save before auth failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Load search preferences after authentication
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Object>} - Loaded preferences
 */
export const loadSearchPreferencesAfterAuth = async (userId) => {
    try {
        console.log('[SEARCH PREFERENCES] Loading after auth for user:', userId);
        
        const preferences = await getSearchPreferences(userId);
        
        if (preferences && Object.keys(preferences).length > 0) {
            console.log('[SEARCH PREFERENCES] ✅ Loaded preferences:', preferences);
            return {
                success: true,
                searchTerm: preferences.search_term || '',
                allergens: preferences.selectedallergens || []
            };
        } else {
            console.log('[SEARCH PREFERENCES] ℹ️  No preferences found');
            return {
                success: true,
                searchTerm: '',
                allergens: []
            };
        }
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES] ❌ Load after auth failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if user has search preferences
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} - Whether user has preferences
 */
export const hasSearchPreferences = async (userId) => {
    try {
        const preferences = await getSearchPreferences(userId);
        return preferences && Object.keys(preferences).length > 0;
    } catch (error) {
        console.error('[SEARCH PREFERENCES] ❌ Check preferences failed:', error);
        return false;
    }
};

/**
 * Get search preferences summary for debugging
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Preferences summary
 */
export const getSearchPreferencesSummary = async (userId) => {
    try {
        const preferences = await getSearchPreferences(userId);
        
        return {
            hasPreferences: preferences && Object.keys(preferences).length > 0,
            searchTerm: preferences?.search_term || '',
            allergenCount: preferences?.selectedallergens?.length || 0,
            allergens: preferences?.selectedallergens || [],
            lastUpdated: preferences?.updatedAt || null
        };
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES] ❌ Get summary failed:', error);
        return {
            hasPreferences: false,
            searchTerm: '',
            allergenCount: 0,
            allergens: [],
            lastUpdated: null,
            error: error.message
        };
    }
}; 

/**
 * Preserve anonymous allergen state during logout
 * @param {string} anonymousUserId - Anonymous user ID
 * @param {Array} currentAllergens - Current allergen selections
 * @returns {Promise<Object>} - Preservation result
 */
export const preserveAnonymousAllergens = async (anonymousUserId, currentAllergens) => {
    try {
        console.log('[SEARCH PREFERENCES] Preserving anonymous allergens during logout...');
        console.log('[SEARCH PREFERENCES] Anonymous user ID:', anonymousUserId);
        console.log('[SEARCH PREFERENCES] Current allergens to preserve:', currentAllergens);
        
        if (!anonymousUserId) {
            console.warn('[SEARCH PREFERENCES] No anonymous user ID, cannot preserve allergens');
            return { success: false, error: 'No anonymous user ID' };
        }
        
        // Save current allergen state to anonymous user
        const result = await saveSearchPreferences('', currentAllergens, anonymousUserId);
        
        console.log('[SEARCH PREFERENCES] ✅ Anonymous allergens preserved successfully');
        return { success: true, data: result };
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES] ❌ Failed to preserve anonymous allergens:', error);
        return { success: false, error: error.message };
    }
}; 