/**
 * Custom Allergen API Functions
 * Handles saving and loading custom allergens for authenticated users
 * Author: Justin Linzan
 * Date: January 2025
 */

import { supabase } from './supabaseClient';

/**
 * Save custom allergen to user's profile
 * @param {Object} customAllergen - The custom allergen object
 * @returns {Promise<Object>} Result of the save operation
 */
export const saveCustomAllergen = async (customAllergen) => {
    try {
        console.log('[CUSTOM_ALLERGEN_API] Saving custom allergen:', customAllergen);
        
        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (!session || !session.user) {
            throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        
        // Try to get existing custom allergens to check for duplicates
        let existingCustomAllergens = [];
        
        try {
            // Try by email first (more reliable for users without supabase_user_id)
            let { data: userData, error } = await supabase
                .from('Users')
                .select('custom_allergens, supabase_user_id')
                .eq('email', session.user.email)
                .single();
            
            // If not found by email, try by supabase_user_id (fallback)
            if (error && error.code === 'PGRST116') {
                console.log('[CUSTOM_ALLERGEN_API] User not found by email, trying by supabase_user_id');
                const userIdResult = await supabase
                    .from('Users')
                    .select('custom_allergens, supabase_user_id')
                    .eq('supabase_user_id', userId)
                    .single();
                
                userData = userIdResult.data;
                error = userIdResult.error;
            }
            
            if (error && error.code !== 'PGRST116') {
                console.warn('[CUSTOM_ALLERGEN_API] Warning fetching user data:', error.message);
            }
            
            existingCustomAllergens = userData?.custom_allergens || [];
            console.log('[CUSTOM_ALLERGEN_API] User data fetched:', {
                hasSupabaseUserId: !!userData?.supabase_user_id,
                customAllergensCount: existingCustomAllergens.length
            });
        } catch (error) {
            console.warn('[CUSTOM_ALLERGEN_API] Warning: Could not fetch existing allergens:', error.message);
            // Continue with empty array - UPSERT will handle it
        }
        
        // Check if allergen already exists (by name)
        const allergenExists = existingCustomAllergens.some(
            allergen => allergen.name.toLowerCase() === customAllergen.name.toLowerCase()
        );
        
        if (allergenExists) {
            throw new Error('This allergen already exists in your custom list');
        }
        
        // Add new custom allergen
        const updatedCustomAllergens = [...existingCustomAllergens, customAllergen];
        
        // Try UPDATE first by email (more reliable), then by supabase_user_id if that fails
        console.log('[CUSTOM_ALLERGEN_API] Attempting to update existing user with custom allergen');
        let { data, error: updateError } = await supabase
            .from('Users')
            .update({
                custom_allergens: updatedCustomAllergens,
                updatedAt: new Date().toISOString()
            })
            .eq('email', session.user.email)
            .select()
            .single();
        
        // If update fails by email, try by supabase_user_id (fallback)
        if (updateError && (updateError.code === 'PGRST116' || updateError.message.includes('No rows'))) {
            console.log('[CUSTOM_ALLERGEN_API] User not found by email, trying by supabase_user_id');
            const userIdUpdateResult = await supabase
                .from('Users')
                .update({
                    custom_allergens: updatedCustomAllergens,
                    updatedAt: new Date().toISOString()
                })
                .eq('supabase_user_id', userId)
                .select()
                .single();
            
            data = userIdUpdateResult.data;
            updateError = userIdUpdateResult.error;
        }
        
        // If update still fails (user doesn't exist), try INSERT
        if (updateError && (updateError.code === 'PGRST116' || updateError.message.includes('No rows'))) {
            console.log('[CUSTOM_ALLERGEN_API] User not found for update, attempting to create new user');
            const insertResult = await supabase
                .from('Users')
                .insert({
                    supabase_user_id: userId,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || '',
                    custom_allergens: updatedCustomAllergens,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();
            
            data = insertResult.data;
            updateError = insertResult.error;
        }
        
        if (updateError) {
            throw new Error(`Failed to save custom allergen: ${updateError.message}`);
        }
        
        console.log('[CUSTOM_ALLERGEN_API] Successfully saved custom allergen');
        return { success: true, data };
        
    } catch (error) {
        console.error('[CUSTOM_ALLERGEN_API] Error saving custom allergen:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Load user's custom allergens
 * @returns {Promise<Array>} Array of custom allergens
 */
export const loadCustomAllergens = async () => {
    try {
        console.log('[CUSTOM_ALLERGEN_API] Loading custom allergens');
        
        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (!session || !session.user) {
            console.log('[CUSTOM_ALLERGEN_API] No authenticated user, returning empty array');
            return [];
        }
        
        const userId = session.user.id;
        
        // Get user's custom allergens - try by email first, then by supabase_user_id
        let { data: userData, error } = await supabase
            .from('Users')
            .select('custom_allergens, supabase_user_id')
            .eq('email', session.user.email)
            .single();
        
        // If not found by email, try by supabase_user_id (fallback)
        if (error && error.code === 'PGRST116') {
            console.log('[CUSTOM_ALLERGEN_API] User not found by email, trying by supabase_user_id');
            const userIdResult = await supabase
                .from('Users')
                .select('custom_allergens, supabase_user_id')
                .eq('supabase_user_id', userId)
                .single();
            
            userData = userIdResult.data;
            error = userIdResult.error;
        }
        
        if (error && error.code === 'PGRST116') {
            // User doesn't exist, return empty array (will be created when they add first allergen)
            console.log('[CUSTOM_ALLERGEN_API] User not found, returning empty custom allergens array');
            return [];
        } else if (error) {
            console.error('[CUSTOM_ALLERGEN_API] Error fetching user:', error);
            throw new Error(`Failed to fetch user data: ${error.message}`);
        }
        
        const customAllergens = userData?.custom_allergens || [];
        console.log(`[CUSTOM_ALLERGEN_API] Loaded ${customAllergens.length} custom allergens`);
        
        return customAllergens;
        
    } catch (error) {
        console.error('[CUSTOM_ALLERGEN_API] Error loading custom allergens:', error);
        return [];
    }
};


/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} Whether user is authenticated
 */
export const isUserAuthenticated = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return !!(session && session.user && session.user.email);
    } catch (error) {
        console.error('[CUSTOM_ALLERGEN_API] Error checking authentication:', error);
        return false;
    }
};

/**
 * Remove custom allergen from user's profile
 * @param {string} allergenName - The name of the allergen to remove
 * @returns {Promise<Object>} Result of the removal operation
 */
export const removeCustomAllergen = async (allergenName) => {
    try {
        console.log('[CUSTOM_ALLERGEN_API] Removing custom allergen:', allergenName);
        
        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (!session || !session.user) {
            throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        
        // Get current custom allergens
        let existingCustomAllergens = [];
        
        try {
            // Try by email first (more reliable for users without supabase_user_id)
            let { data: userData, error } = await supabase
                .from('Users')
                .select('custom_allergens, supabase_user_id')
                .eq('email', session.user.email)
                .single();
            
            // If not found by email, try by supabase_user_id (fallback)
            if (error && error.code === 'PGRST116') {
                console.log('[CUSTOM_ALLERGEN_API] User not found by email, trying by supabase_user_id');
                const userIdResult = await supabase
                    .from('Users')
                    .select('custom_allergens, supabase_user_id')
                    .eq('supabase_user_id', userId)
                    .single();
                
                userData = userIdResult.data;
                error = userIdResult.error;
            }
            
            if (error && error.code !== 'PGRST116') {
                console.warn('[CUSTOM_ALLERGEN_API] Warning fetching user data:', error.message);
            }
            
            existingCustomAllergens = userData?.custom_allergens || [];
            console.log('[CUSTOM_ALLERGEN_API] User data fetched:', {
                hasSupabaseUserId: !!userData?.supabase_user_id,
                customAllergensCount: existingCustomAllergens.length
            });
        } catch (error) {
            console.warn('[CUSTOM_ALLERGEN_API] Warning: Could not fetch existing allergens:', error.message);
            return { success: false, error: 'Could not fetch existing allergens' };
        }
        
        // Remove the allergen from the array
        const updatedCustomAllergens = existingCustomAllergens.filter(
            allergen => allergen.name.toLowerCase() !== allergenName.toLowerCase()
        );
        
        // Update the database - try by email first (more reliable)
        let { data, error: updateError } = await supabase
            .from('Users')
            .update({
                custom_allergens: updatedCustomAllergens,
                updatedAt: new Date().toISOString()
            })
            .eq('email', session.user.email)
            .select()
            .single();
        
        // If update fails by email, try by supabase_user_id (fallback)
        if (updateError && (updateError.code === 'PGRST116' || updateError.message.includes('No rows'))) {
            console.log('[CUSTOM_ALLERGEN_API] User not found by email, trying by supabase_user_id');
            const userIdUpdateResult = await supabase
                .from('Users')
                .update({
                    custom_allergens: updatedCustomAllergens,
                    updatedAt: new Date().toISOString()
                })
                .eq('supabase_user_id', userId)
                .select()
                .single();
            
            data = userIdUpdateResult.data;
            updateError = userIdUpdateResult.error;
        }
        
        if (updateError) {
            throw new Error(`Failed to remove custom allergen: ${updateError.message}`);
        }
        
        console.log('[CUSTOM_ALLERGEN_API] Successfully removed custom allergen');
        return { success: true, data };
        
    } catch (error) {
        console.error('[CUSTOM_ALLERGEN_API] Error removing custom allergen:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get user's email for display purposes
 * @returns {Promise<string|null>} User's email or null
 */
export const getUserEmail = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.email || null;
    } catch (error) {
        console.error('[CUSTOM_ALLERGEN_API] Error getting user email:', error);
        return null;
    }
};
