/**
 * Role-Based Authentication Redux Slice for Dynable RBAC System
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Enhanced Redux slice for managing authentication state:
 * - User credentials and token management
 * - Role-based access control state
 * - Authentication status tracking
 * - Loading and error states
 * - User profile updates with role information
 * - Backward compatibility with existing tokens
 * - Role-based selectors for components
 */

import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { clearCartItems } from './anonymousCartSlice';

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    // Role-based authentication fields
    role: null,
    isVerifiedSeller: false,
    convertedFromAnonymous: false,
    // Supabase token for RLS policies
    supabaseToken: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token, supabaseToken } = action.payload;
            
            // Handle both old and new user formats for backward compatibility
            const userData = {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                // New role-based fields (with fallbacks for old tokens)
                role: user.role || 'end_user',
                is_verified_seller: user.is_verified_seller || false,
                converted_from_anonymous: user.converted_from_anonymous || false,
                // Seller-specific fields
                store_name: user.store_name || null,
                store_description: user.store_description || null,
            };

            state.user = userData;
            state.token = token;
            state.supabaseToken = supabaseToken || null;
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
            
            // Set role-based state for easy access
            state.role = userData.role;
            state.isVerifiedSeller = userData.is_verified_seller;
            state.convertedFromAnonymous = userData.converted_from_anonymous;
        },
        
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        
        logout: (state) => {
            console.log('[AUTH_SLICE] Logout reducer called, clearing auth state');
            state.user = null;
            state.token = null;
            state.supabaseToken = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
            // Clear role-based state
            state.role = null;
            state.isVerifiedSeller = false;
            state.convertedFromAnonymous = false;
            console.log('[AUTH_SLICE] Auth state cleared, isAuthenticated set to false');
        },
        
        clearCredentials: (state) => {
            // Clear credentials but keep loading/error state
            state.user = null;
            state.token = null;
            state.supabaseToken = null;
            state.isAuthenticated = false;
            // Don't clear loading/error state
            // Clear role-based state
            state.role = null;
            state.isVerifiedSeller = false;
            state.convertedFromAnonymous = false;
        },
        
        updateUser: (state, action) => {
            // Update user data while preserving role information
            const updatedUser = { ...state.user, ...action.payload };
            state.user = updatedUser;
            
            // Update role-based state if role information is provided
            if (action.payload.role) {
                state.role = action.payload.role;
            }
            if (action.payload.is_verified_seller !== undefined) {
                state.isVerifiedSeller = action.payload.is_verified_seller;
            }
            if (action.payload.converted_from_anonymous !== undefined) {
                state.convertedFromAnonymous = action.payload.converted_from_anonymous;
            }
        },
        
        // New actions for role-based functionality
        updateRole: (state, action) => {
            const { role, is_verified_seller } = action.payload;
            if (state.user) {
                state.user.role = role;
                state.user.is_verified_seller = is_verified_seller || false;
                state.role = role;
                state.isVerifiedSeller = is_verified_seller || false;
            }
        },
        
        updateSellerStatus: (state, action) => {
            const { is_verified_seller, store_name, store_description } = action.payload;
            if (state.user) {
                state.user.is_verified_seller = is_verified_seller;
                state.user.store_name = store_name;
                state.user.store_description = store_description;
                state.isVerifiedSeller = is_verified_seller;
            }
        },
        
        setAnonymousConversion: (state, action) => {
            const { converted_from_anonymous, anonymous_cart_data } = action.payload;
            if (state.user) {
                state.user.converted_from_anonymous = converted_from_anonymous;
                state.user.anonymous_cart_data = anonymous_cart_data;
                state.convertedFromAnonymous = converted_from_anonymous;
            }
        },
        
        // Action for handling legacy tokens (backward compatibility)
        setLegacyCredentials: (state, action) => {
            const { user, token } = action.payload;
            
            // Handle legacy user format (without role information)
            const userData = {
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
                // Set default values for missing role fields
                role: 'end_user', // Default role for legacy users
                is_verified_seller: false,
                converted_from_anonymous: false,
                store_name: null,
                store_description: null,
            };

            state.user = userData;
            state.token = token;
            state.supabaseToken = null; // Legacy tokens don't have Supabase tokens
            state.isAuthenticated = true;
            state.loading = false;
            state.error = null;
            
            // Set role-based state
            state.role = userData.role;
            state.isVerifiedSeller = userData.is_verified_seller;
            state.convertedFromAnonymous = userData.converted_from_anonymous;
        },
    },
});

export const {
    setCredentials,
    setLoading,
    setError,
    logout,
    updateUser,
    updateRole,
    updateSellerStatus,
    setAnonymousConversion,
    setLegacyCredentials,
    clearCredentials,
} = authSlice.actions;

export default authSlice.reducer;

// Enhanced selectors for role-based access control
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthToken = (state) => state.auth.token;
export const selectSupabaseToken = (state) => state.auth.supabaseToken;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

// Role-based selectors
export const selectUserRole = (state) => state.auth.role;
export const selectIsVerifiedSeller = (state) => state.auth.isVerifiedSeller;
export const selectConvertedFromAnonymous = (state) => state.auth.convertedFromAnonymous;

// Role checking selectors
export const selectIsAdmin = (state) => state.auth.role === 'admin';
export const selectIsSeller = (state) => state.auth.role === 'seller' || state.auth.role === 'admin';
export const selectIsEndUser = (state) => state.auth.role === 'end_user';

// Permission-based selectors
export const selectCanManageProducts = (state) => {
    const role = state.auth.role;
    return role === 'seller' || role === 'admin';
};

export const selectCanManageUsers = (state) => {
    return state.auth.role === 'admin';
};

export const selectCanAccessAdminPanel = (state) => {
    return state.auth.role === 'admin';
};

export const selectCanAccessSellerPanel = (state) => {
    return state.auth.role === 'seller' || state.auth.role === 'admin';
};

export const selectCanCheckout = (state) => {
    // Only authenticated users (not anonymous) can checkout
    return state.auth.isAuthenticated && !state.auth.convertedFromAnonymous;
};

export const selectCanSaveProfile = (state) => {
    // Only authenticated users (not anonymous) can save profile
    return state.auth.isAuthenticated && !state.auth.convertedFromAnonymous;
};

// Utility selectors for components
export const selectUserDisplayName = (state) => {
    const user = state.auth.user;
    return user?.name || user?.email || 'User';
};

export const selectUserEmail = (state) => {
    return state.auth.user?.email || '';
};

export const selectUserPicture = (state) => {
    return state.auth.user?.picture || null;
};

export const selectUserStoreInfo = createSelector(
    [(state) => state.auth.user],
    (user) => {
        if (!user) return null;
        return {
            store_name: user.store_name,
            store_description: user.store_description,
            is_verified_seller: user.is_verified_seller,
        };
    }
);

// Selector for checking if user needs role upgrade
export const selectNeedsRoleUpgrade = (state) => {
    const user = state.auth.user;
    if (!user) return false;
    
    // Check if user is a seller but not verified
    return user.role === 'seller' && !user.is_verified_seller;
};

// Selector for checking if user was converted from anonymous
export const selectHasAnonymousHistory = (state) => {
    return state.auth.convertedFromAnonymous;
};

// Selector for getting anonymous cart data (if available)
export const selectAnonymousCartData = (state) => {
    const user = state.auth.user;
    return user?.anonymous_cart_data || null;
}; 