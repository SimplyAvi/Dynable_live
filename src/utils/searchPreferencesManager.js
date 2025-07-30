/**
 * Search Preferences Manager
 * Handles authentication flow for search preferences (search terms and allergens)
 * Similar to cart system - saves anonymous preferences before auth, merges after auth
 * 
 * Author: Justin Linzan
 * Date: January 2025
 */

import { supabase } from './supabaseClient';
import { getAnonymousUserId } from './supabaseClient';
import { isAnonymousUser } from './anonymousAuth';
import anonymousUserManager from './anonymousUserManager';
import { 
    saveSearchPreferencesBeforeAuth as saveSearchPreferencesBeforeAuthDB,
    loadSearchPreferencesAfterAuth as loadSearchPreferencesAfterAuthDB,
    mergeSearchPreferences as mergeSearchPreferencesDB,
    clearSearchPreferences
} from './searchPreferences';

/**
 * Save search preferences before authentication (like cart save)
 * @param {string} searchTerm - Current search term
 * @param {Array} allergens - Current selected allergens
 * @returns {Promise<Object>} Save result
 */
export const saveSearchPreferencesBeforeAuth = async (searchTerm, allergens) => {
    try {
        console.log('[SEARCH PREFERENCES MANAGER] Saving preferences before auth...');
        
        // Get anonymous user ID
        const anonymousId = getAnonymousUserId();
        if (!anonymousId) {
            console.warn('[SEARCH PREFERENCES MANAGER] No anonymous user ID, creating new session');
            const initResult = await anonymousUserManager.initializeAnonymousUser();
            if (!initResult.success) {
                return { success: false, error: 'Failed to initialize anonymous user' };
            }
        }
        
        const finalAnonymousId = getAnonymousUserId();
        if (!finalAnonymousId) {
            return { success: false, error: 'No anonymous user ID available' };
        }
        
        // Save to database
        const result = await saveSearchPreferencesBeforeAuthDB(searchTerm, allergens, finalAnonymousId);
        
        console.log('[SEARCH PREFERENCES MANAGER] ✅ Preferences saved before auth');
        return { success: true, anonymousId: finalAnonymousId, data: result };
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES MANAGER] ❌ Save before auth failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Load search preferences after authentication
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Object>} Loaded preferences
 */
export const loadSearchPreferencesAfterAuth = async (userId) => {
    try {
        console.log('[SEARCH PREFERENCES MANAGER] Loading preferences after auth for user:', userId);
        
        const preferences = await loadSearchPreferencesAfterAuthDB(userId);
        
        if (preferences.success) {
            console.log('[SEARCH PREFERENCES MANAGER] ✅ Loaded preferences after auth:', preferences);
            return preferences;
        } else {
            console.warn('[SEARCH PREFERENCES MANAGER] ⚠️ No preferences found after auth');
            return {
                success: true,
                searchTerm: '',
                allergens: []
            };
        }
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES MANAGER] ❌ Load after auth failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Merge search preferences from anonymous to authenticated user
 * @param {string} anonymousUserId - Anonymous user ID
 * @param {string} authenticatedUserId - Authenticated user ID
 * @returns {Promise<Object>} Merge result
 */
export const mergeSearchPreferencesOnLogin = async (anonymousUserId, authenticatedUserId) => {
    try {
        console.log('[SEARCH PREFERENCES MANAGER] Merging preferences on login:', {
            anonymousUserId,
            authenticatedUserId
        });
        
        const result = await mergeSearchPreferencesDB(anonymousUserId, authenticatedUserId);
        
        console.log('[SEARCH PREFERENCES MANAGER] ✅ Preferences merged successfully');
        return { success: true, data: result };
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES MANAGER] ❌ Merge preferences failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Handle search preferences during authentication flow
 * @param {string} authenticatedUserId - New authenticated user ID
 * @returns {Promise<Object>} Authentication flow result
 */
export const handleSearchPreferencesAuthFlow = async (authenticatedUserId) => {
    try {
        console.log('[SEARCH PREFERENCES MANAGER] Handling auth flow for user:', authenticatedUserId);
        
        // Get anonymous user data
        const anonymousData = await anonymousUserManager.prepareForIdentityLinking();
        if (!anonymousData.success) {
            console.warn('[SEARCH PREFERENCES MANAGER] No anonymous data to merge');
            return { success: true, message: 'No anonymous data to merge' };
        }
        
        // Save current preferences before auth
        const currentSearchTerm = ''; // Get from Redux state
        const currentAllergens = []; // Get from Redux state
        
        const saveResult = await saveSearchPreferencesBeforeAuthDB(currentSearchTerm, currentAllergens, anonymousData.anonymousId);
        if (!saveResult.success) {
            console.warn('[SEARCH PREFERENCES MANAGER] Failed to save preferences before auth');
        }
        
        // Merge preferences
        const mergeResult = await mergeSearchPreferencesOnLogin(
            anonymousData.anonymousId,
            authenticatedUserId
        );
        
        if (mergeResult.success) {
            console.log('[SEARCH PREFERENCES MANAGER] ✅ Auth flow completed successfully');
            return { success: true, data: mergeResult.data };
        } else {
            console.warn('[SEARCH PREFERENCES MANAGER] ⚠️ Merge failed, but auth flow continues');
            return { success: true, message: 'Auth completed but merge failed' };
        }
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES MANAGER] ❌ Auth flow failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get current search preferences state
 * @returns {Promise<Object>} Current preferences
 */
export const getCurrentSearchPreferences = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const anonymousId = getAnonymousUserId();
        const userId = user ? user.id : anonymousId;
        
        if (!userId) {
            return { success: false, error: 'No user ID available' };
        }
        
        // Get preferences from database
        const preferences = await loadSearchPreferencesAfterAuthDB(userId);
        
        return {
            success: true,
            userId: userId,
            isAnonymous: !user || isAnonymousUser(user.id),
            preferences: preferences
        };
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES MANAGER] ❌ Get current preferences failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear search preferences (for logout)
 * @param {string} userId - User ID to clear preferences for
 * @returns {Promise<Object>} Clear result
 */
export const clearSearchPreferencesOnLogout = async (userId) => {
    try {
        console.log('[SEARCH PREFERENCES MANAGER] Clearing preferences on logout for user:', userId);
        
        // Clear from database
        const result = await clearSearchPreferences(userId);
        
        console.log('[SEARCH PREFERENCES MANAGER] ✅ Preferences cleared on logout');
        return { success: true };
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES MANAGER] ❌ Clear on logout failed:', error);
        return { success: false, error: error.message };
    }
};

export const saveSearchPreferences = async (searchTerm, allergies, userId) => {
    try {
        console.log('[SEARCH PREFERENCES] Saving preferences for user:', userId);
        
        if (!userId) {
            console.log('[SEARCH PREFERENCES] ⚠️ No user ID available, skipping save');
            return { success: true, message: 'No user ID available, preferences not saved' };
        }
        
        const { data, error } = await supabase
            .from('SearchPreferences')
            .upsert({
                supabase_user_id: userId,
                search_term: searchTerm || '',
                allergies: allergies || {}
            }, {
                onConflict: 'supabase_user_id'
            });
        
        if (error) {
            console.error('[SEARCH PREFERENCES] Error saving preferences:', error);
            return { success: false, error: error.message };
        }
        
        console.log('[SEARCH PREFERENCES] ✅ Preferences saved successfully');
        return { success: true, data };
        
    } catch (error) {
        console.error('[SEARCH PREFERENCES] Error in saveSearchPreferences:', error);
        return { success: false, error: error.message };
    }
};

const searchPreferencesManager = {
    saveSearchPreferencesBeforeAuth,
    loadSearchPreferencesAfterAuth,
    mergeSearchPreferencesOnLogin,
    handleSearchPreferencesAuthFlow,
    getCurrentSearchPreferences,
    clearSearchPreferencesOnLogout
};

export default searchPreferencesManager; 