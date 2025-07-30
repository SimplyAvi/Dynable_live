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
        console.log('[SEARCH PREFERENCES] Merging preferences:', { anonymousUserId, authenticatedUserId });
        
        const { data, error } = await supabase.rpc('merge_search_preferences', {
            p_anonymous_user_id: anonymousUserId,
            p_authenticated_user_id: authenticatedUserId
        });
        
        if (error) {
            console.error('[SEARCH PREFERENCES] Error merging preferences:', error);
            throw new Error(`Failed to merge search preferences: ${error.message}`);
        }
        
        console.log('[SEARCH PREFERENCES] ✅ Preferences merged successfully:', data);
        return data;
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES] ❌ Merge preferences failed:', error);
        throw error;
    }
};

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
                allergens: preferences.selected_allergens || []
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
            allergenCount: preferences?.selected_allergens?.length || 0,
            allergens: preferences?.selected_allergens || [],
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