/**
 * Identity Linking Utilities for Dynable RBAC System
 * Handles conversion from anonymous to authenticated users
 * Based on Supabase Identity Linking: https://supabase.com/docs/guides/auth/auth-identity-linking#manual-linking-beta
 * 
 * Author: Justin Linzan
 * Date: June 2025
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role for admin operations
// Make it optional to handle missing environment variables gracefully
let supabase = null;

try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('[IDENTITY_LINKING] Supabase client initialized successfully');
  } else {
    console.warn('[IDENTITY_LINKING] Supabase environment variables not set - identity linking disabled');
  }
} catch (error) {
  console.warn('[IDENTITY_LINKING] Failed to initialize Supabase client:', error.message);
}

/**
 * Link anonymous user to authenticated user
 * @param {string} anonymousUserId - Anonymous user ID
 * @param {string} authenticatedUserId - Authenticated user ID
 * @param {Object} cartData - Cart data to transfer
 * @returns {Object} Result of linking operation
 */
const linkAnonymousToAuthenticated = async (anonymousUserId, authenticatedUserId, cartData = null) => {
  try {
    // Check if Supabase is available
    if (!supabase) {
      console.warn('[IDENTITY_LINKING] Supabase not available - skipping identity linking');
      return { 
        success: true, 
        message: 'Identity linking skipped - Supabase not configured',
        skipped: true
      };
    }

    // Step 1: Link the identities in Supabase
    const { data: linkData, error: linkError } = await supabase.auth.admin.linkUser({
      primaryUserId: authenticatedUserId,
      userToLinkId: anonymousUserId,
    });

    if (linkError) {
      console.error('Identity linking error:', linkError);
      return { success: false, error: linkError.message };
    }

    // Step 2: Update user record with conversion flag
    const { error: updateError } = await supabase
      .from('Users')
      .update({
        converted_from_anonymous: true,
        anonymous_cart_data: cartData ? JSON.stringify(cartData) : null,
      })
      .eq('id', authenticatedUserId);

    if (updateError) {
      console.error('User update error:', updateError);
      return { success: false, error: updateError.message };
    }

    // Step 3: Transfer cart data if provided
    if (cartData) {
      const { error: cartError } = await transferCartData(anonymousUserId, authenticatedUserId, cartData);
      if (cartError) {
        console.error('Cart transfer error:', cartError);
        // Don't fail the entire operation for cart transfer issues
      }
    }

    return { 
      success: true, 
      data: linkData,
      message: 'Anonymous user successfully linked to authenticated account'
    };

  } catch (error) {
    console.error('Identity linking failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Transfer cart data from anonymous to authenticated user
 * @param {string} anonymousUserId - Anonymous user ID
 * @param {string} authenticatedUserId - Authenticated user ID
 * @param {Object} cartData - Cart data to transfer
 * @returns {Object} Result of cart transfer
 */
const transferCartData = async (anonymousUserId, authenticatedUserId, cartData) => {
  try {
    // Check if authenticated user already has a cart
    const { data: existingCart, error: fetchError } = await supabase
      .from('Carts')
      .select('*')
      .eq('userId', authenticatedUserId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { success: false, error: fetchError.message };
    }

    if (existingCart) {
      // Merge cart data with existing cart
      const mergedItems = mergeCartItems(existingCart.items || [], cartData.items || []);
      
      const { error: updateError } = await supabase
        .from('Carts')
        .update({ items: mergedItems })
        .eq('userId', authenticatedUserId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      // Create new cart for authenticated user
      const { error: insertError } = await supabase
        .from('Carts')
        .insert({
          userId: authenticatedUserId,
          items: cartData.items || []
        });

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    return { success: true, message: 'Cart data transferred successfully' };

  } catch (error) {
    console.error('Cart transfer failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Merge cart items from anonymous and authenticated users
 * @param {Array} existingItems - Existing cart items
 * @param {Array} newItems - New cart items to merge
 * @returns {Array} Merged cart items
 */
const mergeCartItems = (existingItems, newItems) => {
  const merged = [...existingItems];
  
  newItems.forEach(newItem => {
    const existingIndex = merged.findIndex(item => 
      item.productId === newItem.productId
    );
    
    if (existingIndex >= 0) {
      // Item exists, update quantity
      merged[existingIndex].quantity = (merged[existingIndex].quantity || 0) + (newItem.quantity || 1);
    } else {
      // New item, add to cart
      merged.push(newItem);
    }
  });
  
  return merged;
};

/**
 * Check if user was converted from anonymous
 * @param {string} userId - User ID to check
 * @returns {boolean} Whether user was converted from anonymous
 */
const isConvertedFromAnonymous = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('converted_from_anonymous, anonymous_cart_data')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking conversion status:', error);
      return false;
    }

    return data.converted_from_anonymous === true;
  } catch (error) {
    console.error('Error checking conversion status:', error);
    return false;
  }
};

/**
 * Get anonymous cart data for a converted user
 * @param {string} userId - User ID
 * @returns {Object|null} Anonymous cart data or null
 */
const getAnonymousCartData = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('anonymous_cart_data')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching anonymous cart data:', error);
      return null;
    }

    return data.anonymous_cart_data ? JSON.parse(data.anonymous_cart_data) : null;
  } catch (error) {
    console.error('Error fetching anonymous cart data:', error);
    return null;
  }
};

/**
 * Clean up anonymous user data after successful conversion
 * @param {string} userId - User ID
 * @returns {Object} Result of cleanup operation
 */
const cleanupAnonymousData = async (userId) => {
  try {
    const { error } = await supabase
      .from('Users')
      .update({ 
        anonymous_cart_data: null,
        converted_from_anonymous: false // Reset flag after cleanup
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Anonymous data cleaned up successfully' };
  } catch (error) {
    console.error('Cleanup failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  linkAnonymousToAuthenticated,
  transferCartData,
  mergeCartItems,
  isConvertedFromAnonymous,
  getAnonymousCartData,
  cleanupAnonymousData,
}; 