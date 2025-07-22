/**
 * Anonymous User Management with Supabase Integration and Fallback Support
 * Handles both Supabase native anonymous auth and fallback localStorage approach
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

import { signInAnonymously, getAnonymousUserId, isAnonymousUser, getCurrentSession } from './supabaseClient';

/**
 * Initialize anonymous user session (with fallback support)
 * @returns {Promise<Object>} Result of initialization
 */
export const initializeAnonymousUser = async () => {
  try {
    console.log('[ANONYMOUS] Initializing anonymous user...');
    
    // Check if we already have an anonymous session
    const session = await getCurrentSession();
    const existingAnonymousId = getAnonymousUserId();
    
    if (session && existingAnonymousId) {
      console.log('[ANONYMOUS] Existing anonymous session found:', existingAnonymousId);
      return { 
        success: true, 
        anonymousId: existingAnonymousId,
        session: session,
        isNew: false,
        fallback: false
      };
    }
    
    if (existingAnonymousId) {
      console.log('[ANONYMOUS] Existing fallback anonymous session found:', existingAnonymousId);
      return { 
        success: true, 
        anonymousId: existingAnonymousId,
        session: null,
        isNew: false,
        fallback: true
      };
    }
    
    // Create new anonymous session (with fallback support)
    const result = await signInAnonymously();
    
    if (!result.success) {
      console.error('[ANONYMOUS] Failed to create anonymous session:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('[ANONYMOUS] Anonymous session created:', result.user.id, 'Fallback:', result.fallback);
    
    return {
      success: true,
      anonymousId: result.user.id,
      session: result.session,
      isNew: true,
      fallback: result.fallback || false
    };
  } catch (error) {
    console.error('[ANONYMOUS] Anonymous user initialization failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get anonymous cart data with session support
 * @returns {Promise<Object>} Anonymous cart data
 */
export const getAnonymousCartData = async () => {
  try {
    const anonymousId = getAnonymousUserId();
    
    if (!anonymousId) {
      console.log('[ANONYMOUS] No anonymous user ID found');
      return { success: false, error: 'No anonymous user' };
    }
    
    // Get cart from localStorage (works for both Supabase and fallback)
    const cartData = localStorage.getItem('anonymous_cart');
    const items = cartData ? JSON.parse(cartData) : [];
    
    console.log('[ANONYMOUS] Retrieved cart data for user:', anonymousId, 'Items:', items.length);
    
    return {
      success: true,
      anonymousId: anonymousId,
      cartItems: items,
      cartData: {
        anonymousId: anonymousId,
        items: items,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[ANONYMOUS] Failed to get anonymous cart data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save anonymous cart data
 * @param {Array} items - Cart items to save
 * @returns {Promise<Object>} Result of save operation
 */
export const saveAnonymousCartData = async (items) => {
  try {
    const anonymousId = getAnonymousUserId();
    
    if (!anonymousId) {
      console.log('[ANONYMOUS] No anonymous user ID found, creating new session');
      const initResult = await initializeAnonymousUser();
      if (!initResult.success) {
        return { success: false, error: 'Failed to initialize anonymous user' };
      }
    }
    
    // Save to localStorage (works for both Supabase and fallback)
    localStorage.setItem('anonymous_cart', JSON.stringify(items));
    
    console.log('[ANONYMOUS] Saved cart data for user:', getAnonymousUserId(), 'Items:', items.length);
    
    return { success: true, items: items };
  } catch (error) {
    console.error('[ANONYMOUS] Failed to save anonymous cart data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prepare anonymous user for identity linking (with fallback support)
 * @returns {Promise<Object>} Anonymous user data for linking
 */
export const prepareForIdentityLinking = async () => {
  try {
    console.log('[ANONYMOUS] Preparing for identity linking...');
    
    // Ensure we have an anonymous session
    const initResult = await initializeAnonymousUser();
    if (!initResult.success) {
      return { success: false, error: initResult.error };
    }
    
    // Get current cart data
    const cartResult = await getAnonymousCartData();
    if (!cartResult.success) {
      return { success: false, error: cartResult.error };
    }
    
    console.log('[ANONYMOUS] Prepared for identity linking:', {
      anonymousId: cartResult.anonymousId,
      cartItems: cartResult.cartItems.length,
      fallback: initResult.fallback
    });
    
    return {
      success: true,
      anonymousId: cartResult.anonymousId,
      cartData: cartResult.cartData,
      cartItems: cartResult.cartItems,
      fallback: initResult.fallback
    };
  } catch (error) {
    console.error('[ANONYMOUS] Failed to prepare for identity linking:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up anonymous user data after successful conversion
 * @returns {Promise<Object>} Result of cleanup
 */
export const cleanupAnonymousData = () => {
  try {
    console.log('[ANONYMOUS] Cleaning up anonymous user data...');
    
    // Remove anonymous user ID
    localStorage.removeItem('anonymous_user_id');
    
    // Remove anonymous cart data
    localStorage.removeItem('anonymous_cart');
    
    console.log('[ANONYMOUS] Anonymous user data cleaned up successfully');
    
    return { success: true };
  } catch (error) {
    console.error('[ANONYMOUS] Failed to cleanup anonymous data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if current user is anonymous
 * @returns {boolean} Whether user is anonymous
 */
export const isCurrentUserAnonymous = () => {
  return isAnonymousUser();
};

/**
 * Get anonymous user ID if exists
 * @returns {string|null} Anonymous user ID or null
 */
export const getCurrentAnonymousId = () => {
  return getAnonymousUserId();
};

const anonymousUserManager = {
  initializeAnonymousUser,
  getAnonymousCartData,
  saveAnonymousCartData,
  prepareForIdentityLinking,
  cleanupAnonymousData,
  isCurrentUserAnonymous,
  getCurrentAnonymousId
};

export default anonymousUserManager; 