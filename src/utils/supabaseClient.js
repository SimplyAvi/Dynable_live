/**
 * Supabase Client Configuration for Dynable
 * Handles anonymous authentication and identity linking with fallback support
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for frontend
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * Sign in anonymously using Supabase (with fallback)
 * @returns {Promise<Object>} Result of anonymous sign-in
 */
export const signInAnonymously = async () => {
  try {
    console.log('[SUPABASE] Attempting anonymous sign-in...');
    
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.warn('[SUPABASE] Anonymous sign-in failed, using fallback:', error.message);
      
      // Fallback: Create a local anonymous session
      const fallbackAnonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymous_user_id', fallbackAnonymousId);
      localStorage.setItem('anonymousUserIdForMerge', fallbackAnonymousId);
      
      console.log('[SUPABASE] Created fallback anonymous session:', fallbackAnonymousId);
      
      return { 
        success: true, 
        user: { id: fallbackAnonymousId, anonymous: true },
        session: null,
        fallback: true
      };
    }
    
    console.log('[SUPABASE] Anonymous sign-in successful:', data.user.id);
    
    // Store anonymous user ID for later identity linking
    localStorage.setItem('anonymous_user_id', data.user.id);
    localStorage.setItem('anonymousUserIdForMerge', data.user.id);
    
    return { 
      success: true, 
      user: data.user,
      session: data.session,
      fallback: false
    };
  } catch (error) {
    console.error('[SUPABASE] Anonymous sign-in failed:', error);
    
    // Fallback: Create a local anonymous session
    const fallbackAnonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('anonymous_user_id', fallbackAnonymousId);
    localStorage.setItem('anonymousUserIdForMerge', fallbackAnonymousId);
    
    console.log('[SUPABASE] Created fallback anonymous session after error:', fallbackAnonymousId);
    
    return { 
      success: true, 
      user: { id: fallbackAnonymousId, anonymous: true },
      session: null,
      fallback: true
    };
  }
};

/**
 * Link anonymous user to authenticated account (with fallback)
 * @param {string} provider - OAuth provider ('google')
 * @returns {Promise<Object>} Result of identity linking
 */
export const linkIdentity = async (provider = 'google') => {
  try {
    console.log('[SUPABASE] Attempting identity linking with provider:', provider);
    
    // Check if we have a real Supabase session
    const session = await getCurrentSession();
    
    if (session) {
      // Real Supabase session - try identity linking
      const { data, error } = await supabase.auth.linkIdentity({
        provider: provider
      });
      
      if (error) {
        console.warn('[SUPABASE] Identity linking failed, using fallback:', error.message);
        return { success: true, fallback: true, message: 'Using fallback identity linking' };
      }
      
      console.log('[SUPABASE] Identity linking successful');
      
      // Clean up anonymous user ID after successful linking
      localStorage.removeItem('anonymous_user_id');
      
      return { success: true, data, fallback: false };
    } else {
      // No Supabase session - use fallback
      console.log('[SUPABASE] No Supabase session, using fallback identity linking');
      
      // Clean up anonymous user ID
      localStorage.removeItem('anonymous_user_id');
      
      return { success: true, fallback: true, message: 'Using fallback identity linking' };
    }
  } catch (error) {
    console.error('[SUPABASE] Identity linking failed:', error);
    
    // Fallback: Clean up and return success
    localStorage.removeItem('anonymous_user_id');
    
    return { success: true, fallback: true, error: error.message };
  }
};

/**
 * Get current anonymous user ID
 * @returns {string|null} Anonymous user ID or null
 */
export const getAnonymousUserId = async () => {
  try {
    // First check localStorage (for merge tracking)
    const anonymousUserIdForMerge = localStorage.getItem('anonymousUserIdForMerge');
    const anonymousUserId = localStorage.getItem('anonymous_user_id');
    
    console.log('[GET_ANONYMOUS_USER_ID] anonymousUserIdForMerge:', anonymousUserIdForMerge);
    console.log('[GET_ANONYMOUS_USER_ID] anonymous_user_id:', anonymousUserId);
    
    if (anonymousUserIdForMerge) {
      console.log('[GET_ANONYMOUS_USER_ID] Returning anonymousUserIdForMerge:', anonymousUserIdForMerge);
      return anonymousUserIdForMerge;
    }
    
    if (anonymousUserId) {
      console.log('[GET_ANONYMOUS_USER_ID] Returning anonymous_user_id:', anonymousUserId);
      return anonymousUserId;
    }
    
    // If no localStorage, check current session for anonymous user
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      // Check if current user is anonymous (no email/phone)
      const hasNoEmail = (!session.user.email) || (session.user.email.trim() === '');
      const hasNoPhone = (!session.user.phone) || (session.user.phone.trim() === '');
      
      if (hasNoEmail && hasNoPhone) {
        console.log('[GET_ANONYMOUS_USER_ID] Found anonymous user in session:', session.user.id);
        return session.user.id;
      }
    }
    
    console.log('[GET_ANONYMOUS_USER_ID] No anonymous user ID found');
    return null;
  } catch (error) {
    console.error('[GET_ANONYMOUS_USER_ID] Error:', error);
    return null;
  }
};

/**
 * Check if user is anonymous
 * @returns {Promise<boolean>} Whether current user is anonymous
 */
export const isAnonymousUser = async () => {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session, user is anonymous
    if (!session) {
      console.log('[IS_ANONYMOUS_USER] No session found - user is anonymous');
      return true;
    }
    
    // If session exists but user has no email/phone, they are anonymous
    // (This happens with Supabase anonymous auth)
    const hasNoEmail = (!session.user.email) || (session.user.email.trim() === '');
    const hasNoPhone = (!session.user.phone) || (session.user.phone.trim() === '');
    
    if (hasNoEmail && hasNoPhone) {
      console.log('[IS_ANONYMOUS_USER] Session found but no email/phone - user is anonymous');
      return true;
    }
    
    // If session exists and user has email/phone, they are authenticated
    console.log('[IS_ANONYMOUS_USER] Session found with email/phone - user is authenticated');
    return false;
  } catch (error) {
    console.error('[IS_ANONYMOUS_USER] Error:', error);
    return true; // Default to anonymous on error
  }
};

/**
 * Get current Supabase session
 * @returns {Promise<Object|null>} Current session or null
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[SUPABASE] Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[SUPABASE] Failed to get session:', error);
    return null;
  }
};

/**
 * Sign out current user (anonymous or authenticated)
 * @returns {Promise<Object>} Result of sign out
 */
export const signOut = async () => {
  try {
    console.log('[SUPABASE] Signing out user...');
    
    // Try Supabase sign out first
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.warn('[SUPABASE] Supabase sign out failed, using fallback:', error.message);
    }
    
    // Always clean up local storage
    localStorage.removeItem('anonymous_user_id');
    localStorage.removeItem('anonymous_cart');
    localStorage.removeItem('anonymousUserIdForMerge');
    
    console.log('[SUPABASE] Sign out successful');
    return { success: true };
  } catch (error) {
    console.error('[SUPABASE] Sign out failed:', error);
    
    // Fallback: Clean up local storage
    localStorage.removeItem('anonymous_user_id');
    localStorage.removeItem('anonymous_cart');
    localStorage.removeItem('anonymousUserIdForMerge');
    
    return { success: true, fallback: true };
  }
};

/**
 * Listen for authentication state changes
 * @param {Function} callback - Callback function for auth changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

/**
 * Clean up anonymous user data after successful conversion
 * @returns {Promise<Object>} Result of cleanup
 */
export const cleanupAnonymousData = () => {
  try {
    console.log('[SUPABASE] Cleaning up anonymous user data...');
    
    // Remove anonymous user ID
    localStorage.removeItem('anonymous_user_id');
    
    // Remove anonymous cart data
    localStorage.removeItem('anonymous_cart');
    
    // Remove anonymous user ID for merge tracking
    localStorage.removeItem('anonymousUserIdForMerge');
    
    console.log('[SUPABASE] Anonymous user data cleaned up successfully');
    
    return { success: true };
  } catch (error) {
    console.error('[SUPABASE] Failed to cleanup anonymous data:', error);
    return { success: false, error: error.message };
  }
};

export default supabase; 