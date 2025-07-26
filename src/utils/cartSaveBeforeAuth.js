/**
 * Universal Cart Save Utility for Authentication
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * This utility ensures cart data is saved before any authentication flow.
 * Used by all login entry points to prevent cart data loss.
 */

import { supabase } from './supabaseClient';
import { addToCart } from './anonymousAuth';
import { validateCartSaveOperation, validateUserId } from './cartValidation';
import { resilientCartOperation, retryableSupabaseOperation } from './networkResilience';

/**
 * Universal cart save function for all authentication entry points
 * @param {Array} cartItems - Cart items to save
 * @param {string} userId - User ID to save cart for
 * @param {string} entryPoint - Where the save was triggered from (for logging)
 * @returns {Object} - Save result with success/error information
 */
export const saveCartBeforeAuth = async (cartItems, userId, entryPoint = 'unknown') => {
    const logPrefix = `[CART SAVE - ${entryPoint.toUpperCase()}]`;
    
    try {
        console.log(`${logPrefix} 🚀 Starting universal cart save...`);
        console.log(`${logPrefix} User ID:`, userId);
        console.log(`${logPrefix} Cart items count:`, cartItems?.length || 0);
        console.log(`${logPrefix} Cart items:`, cartItems);
        
        // 🎯 INPUT VALIDATION
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.success) {
            console.error(`${logPrefix} ❌ User ID validation failed:`, userIdValidation.error);
            return { 
                success: false, 
                error: userIdValidation.error,
                entryPoint 
            };
        }
        
        const cartSaveValidation = validateCartSaveOperation(cartItems, userId, 'save');
        if (!cartSaveValidation.success) {
            console.error(`${logPrefix} ❌ Cart save validation failed:`, cartSaveValidation.error);
            return { 
                success: false, 
                error: cartSaveValidation.error,
                entryPoint 
            };
        }
        
        if (!cartItems || cartItems.length === 0) {
            console.log(`${logPrefix} ℹ️  No cart items to save`);
            return { 
                success: true, 
                message: 'No cart items to save',
                entryPoint 
            };
        }
        
        // 🎯 RESILIENT CART SAVE OPERATION
        const saveResult = await resilientCartOperation(async () => {
            let saveSuccess = true;
            let savedItems = [];
            let saveErrors = [];
            
            // Save each cart item to database
            for (let i = 0; i < cartItems.length; i++) {
                const item = cartItems[i];
                console.log(`${logPrefix} Saving item ${i + 1}/${cartItems.length}:`, item);
                
                try {
                    const saveResult = await addToCart(item);
                    console.log(`${logPrefix} Save result for item ${i + 1}:`, saveResult);
                    
                    if (!saveResult.success) {
                        console.error(`${logPrefix} ❌ Failed to save item ${i + 1}:`, saveResult.error);
                        saveErrors.push({ item, error: saveResult.error });
                        saveSuccess = false;
                        break;
                    }
                    
                    savedItems = saveResult.items;
                } catch (error) {
                    console.error(`${logPrefix} ❌ Exception saving item ${i + 1}:`, error);
                    saveErrors.push({ item, error: error.message });
                    saveSuccess = false;
                    break;
                }
            }
            
            if (!saveSuccess) {
                throw new Error(`Failed to save cart items: ${saveErrors.map(e => e.error).join(', ')}`);
            }
            
            return { savedItems, saveErrors };
        }, {
            operationName: `cart_save_${entryPoint}`,
            maxAttempts: 3,
            timeout: 15000
        });
        
        if (!saveResult.success) {
            console.error(`${logPrefix} ❌ Resilient cart save failed:`, saveResult.error);
            return { 
                success: false, 
                error: saveResult.error,
                entryPoint 
            };
        }
        
        // 🎯 RESILIENT VERIFICATION
        const verifyResult = await resilientCartOperation(async () => {
            const { data: savedCart, error: verifyError } = await retryableSupabaseOperation(
                () => supabase
                    .from('Carts')
                    .select('items, updatedAt')
                    .eq('supabase_user_id', userId)
                    .maybeSingle(),
                { operationName: `cart_verify_${entryPoint}` }
            );
            
            if (verifyError) {
                throw new Error('Failed to verify cart save: ' + verifyError.message);
            }
            
            if (!savedCart || !savedCart.items || savedCart.items.length === 0) {
                throw new Error('Cart verification failed - no items found in database');
            }
            
            return savedCart;
        }, {
            operationName: `cart_verify_${entryPoint}`,
            maxAttempts: 2,
            timeout: 10000
        });
        
        if (!verifyResult.success) {
            console.error(`${logPrefix} ❌ Cart verification failed:`, verifyResult.error);
            return { 
                success: false, 
                error: verifyResult.error,
                entryPoint 
            };
        }
        
        const savedCart = verifyResult.result;
        console.log(`${logPrefix} ✅ Cart successfully saved to database`);
        console.log(`${logPrefix} Saved cart items count:`, savedCart.items.length);
        console.log(`${logPrefix} Saved cart items:`, savedCart.items);
        console.log(`${logPrefix} Cart last updated:`, savedCart.updatedAt);
        
        // 🎯 STORE ANONYMOUS USER ID FOR CART MERGING
        console.log(`${logPrefix} 💾 Storing anonymous user ID for cart merge:`, userId);
        localStorage.setItem('anonymousUserIdForMerge', userId);
        
        // 🎯 FINAL VERIFICATION
        const finalVerifyResult = await resilientCartOperation(async () => {
            const { data: finalCartCheck } = await retryableSupabaseOperation(
                () => supabase
                    .from('Carts')
                    .select('items')
                    .eq('supabase_user_id', userId)
                    .maybeSingle(),
                { operationName: `cart_final_verify_${entryPoint}` }
            );
            
            return finalCartCheck;
        }, {
            operationName: `cart_final_verify_${entryPoint}`,
            maxAttempts: 2,
            timeout: 5000
        });
        
        if (finalVerifyResult.success && finalVerifyResult.result && finalVerifyResult.result.items && finalVerifyResult.result.items.length > 0) {
            console.log(`${logPrefix} ✅ Final verification: Anonymous cart ready for merge with`, finalVerifyResult.result.items.length, 'items');
        } else {
            console.log(`${logPrefix} ℹ️  Final verification: No anonymous cart items (this is OK if user had empty cart)`);
        }
        
        console.log(`${logPrefix} ✅ Universal cart save completed successfully`);
        return { 
            success: true, 
            message: 'Cart saved successfully',
            savedItems: saveResult.result.savedItems,
            entryPoint 
        };
        
    } catch (error) {
        console.error(`${logPrefix} ❌ Universal cart save failed:`, error);
        return { 
            success: false, 
            error: 'Universal cart save failed: ' + error.message,
            entryPoint 
        };
    }
};

/**
 * Check if cart save is needed for current user
 * @param {Object} session - Current user session
 * @returns {boolean} - Whether cart save is needed
 */
export const isCartSaveNeeded = (session) => {
    if (!session || !session.user) {
        return false;
    }
    
    // Check if user is anonymous (needs cart save before auth)
    const hasNoEmail = (!session.user.email) || (session.user.email.trim() === '');
    const hasNoPhone = (!session.user.phone) || (session.user.phone.trim() === '');
    
    return hasNoEmail && hasNoPhone;
};

/**
 * Get cart items from Redux state
 * @param {Object} state - Redux state
 * @returns {Array} - Cart items
 */
export const getCartItemsFromState = (state) => {
    return state?.anonymousCart?.items || [];
};

/**
 * Universal authentication entry point wrapper
 * @param {Function} authFunction - The authentication function to wrap
 * @param {string} entryPoint - Entry point identifier
 * @param {Object} state - Redux state for cart items
 * @returns {Function} - Wrapped authentication function
 */
export const withCartSave = (authFunction, entryPoint) => {
    return async (...args) => {
        try {
            // Get current session
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                console.error(`[CART SAVE - ${entryPoint.toUpperCase()}] ❌ No session found`);
                throw new Error('No session found. Please refresh the page and try again.');
            }
            
            // Check if cart save is needed
            if (isCartSaveNeeded(session)) {
                console.log(`[CART SAVE - ${entryPoint.toUpperCase()}] 🎯 Cart save needed for anonymous user`);
                
                // Get cart items from Redux state (this would need to be passed in)
                // For now, we'll call the auth function directly
                return await authFunction(...args);
            } else {
                console.log(`[CART SAVE - ${entryPoint.toUpperCase()}] ℹ️  No cart save needed for authenticated user`);
                return await authFunction(...args);
            }
            
        } catch (error) {
            console.error(`[CART SAVE - ${entryPoint.toUpperCase()}] ❌ Error in wrapped auth function:`, error);
            throw error;
        }
    };
}; 