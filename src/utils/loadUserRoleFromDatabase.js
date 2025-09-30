/**
 * Load User Role from Database
 * Author: Justin Linzan
 * Date: September 2025
 * 
 * This utility ensures the user's role is properly loaded from the database
 * and updates the Redux state with the correct tier information
 */

import { supabase } from './supabaseClient';

/**
 * Load user role from database and update Redux state
 */
export const loadUserRoleFromDatabase = async (userEmail, dispatch, updateUser) => {
    try {
        console.log('[USER_ROLE] Loading user role from database for:', userEmail);
        
        // Fetch user data from database
        const { data: userData, error } = await supabase
            .from('Users')
            .select('id, email, name, role, custom_allergens, "createdAt"')
            .eq('email', userEmail)
            .single();

        if (error) {
            console.error('[USER_ROLE] Error fetching user data:', error);
            return null;
        }

        if (!userData) {
            console.error('[USER_ROLE] No user data found for:', userEmail);
            return null;
        }

        console.log('[USER_ROLE] ✅ User data loaded from database:', {
            email: userData.email,
            role: userData.role,
            custom_allergens: userData.custom_allergens
        });

        console.log('[USER_ROLE] 🔄 Updating Redux state with role:', userData.role);

        // Update Redux state with correct role (preserve existing auth state)
        dispatch(updateUser({
            role: userData.role, // Use the role from database
            custom_allergens: userData.custom_allergens,
            createdAt: userData.createdAt
        }));

        return userData;
    } catch (error) {
        console.error('[USER_ROLE] Error loading user role:', error);
        return null;
    }
};

/**
 * Check if user role needs to be refreshed
 */
export const shouldRefreshUserRole = (user) => {
    console.log('[USER_ROLE] Checking if user role needs refresh:', {
        hasUser: !!user,
        userRole: user?.role,
        needsRefresh: !user?.role || user.role === 'end_user' || user.role === 'authenticated'
    });
    
    // If user has no role, has old 'end_user' role, or has generic 'authenticated' role, refresh from database
    return !user?.role || user.role === 'end_user' || user.role === 'authenticated';
};

/**
 * Auto-refresh user role if needed
 */
export const autoRefreshUserRole = async (user, dispatch, updateUser) => {
    if (shouldRefreshUserRole(user)) {
        console.log('[USER_ROLE] Auto-refreshing user role...');
        return await loadUserRoleFromDatabase(user.email, dispatch, updateUser);
    }
    return user;
};
