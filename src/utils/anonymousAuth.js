/**
 * Anonymous Authentication Utilities
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Simplified Supabase anonymous auth utilities:
 * - Pure Supabase operations only
 * - No cookies, no localStorage fallbacks
 * - Simple database-only cart management
 */

import { supabase } from './supabaseClient';

/**
 * Improved anonymous user detection
 * Anonymous users in Supabase have empty email and phone fields
 */
export function isAnonymousUser(session) {
    if (!session || !session.user) {
        return false;
    }
    
    // Check for explicit anonymous flag
    if (session.user.app_metadata?.is_anonymous === true) {
        return true;
    }
    
    // Check for empty email and phone (anonymous users typically have no email/phone)
    const hasNoEmail = (!session.user.email) || (session.user.email.trim() === '');
    const hasNoPhone = (!session.user.phone) || (session.user.phone.trim() === '');
    
    // User is anonymous if they have no email AND no phone
    return hasNoEmail && hasNoPhone;
}

/**
 * Initialize anonymous authentication
 */
export const initializeAnonymousAuth = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            console.log('[ANONYMOUS AUTH] Existing session found:', session.user.id);
            console.log('[ANONYMOUS AUTH] Session user details:', session.user);
            
            const isAnonymous = isAnonymousUser(session);
            return {
                session,
                isAnonymous,
                success: true
            };
        }
        
        console.log('[ANONYMOUS AUTH] No existing session, creating anonymous session...');
        
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
            console.error('[ANONYMOUS AUTH] Anonymous sign-in failed:', error);
            return {
                session: null,
                isAnonymous: false,
                success: false,
                error: error.message
            };
        }
        
        console.log('[ANONYMOUS AUTH] Anonymous sign-in successful:', data.user.id);
        console.log('[ANONYMOUS AUTH] Anonymous user details:', data.user);
        
        return {
            session: data.session,
            isAnonymous: true,
            success: true
        };
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] Error initializing anonymous auth:', error);
        return {
            session: null,
            isAnonymous: false,
            success: false,
            error: error.message
        };
    }
};

/**
 * Get cart items for current user
 */
export const getCart = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            console.log('[ANONYMOUS AUTH] No session found, cannot fetch cart');
            return [];
        }
        
        console.log('[ANONYMOUS AUTH] Fetching cart for user:', session.user.id);
        
        const { data: cart, error } = await supabase
            .from('Carts')
            .select('items')
            .eq('supabase_user_id', session.user.id)
            .maybeSingle();
        
        if (error) {
            console.error('[ANONYMOUS AUTH] Error fetching cart:', error);
            return [];
        }
        
        const items = cart?.items || [];
        console.log('[ANONYMOUS AUTH] Cart items:', items);
        
        return items;
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] Error in getCart:', error);
        return [];
    }
};

/**
 * Add item to cart
 */
export const addToCart = async (item) => {
    try {
        console.log('[ANONYMOUS AUTH] 🚨 ADD TO CART CALLED with item:', item);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            console.log('[ANONYMOUS AUTH] ❌ No session found, cannot add to cart');
            return { success: false, error: 'No session found' };
        }
        
        console.log('[ANONYMOUS AUTH] ✅ Session found, adding item to cart:', item);
        console.log('[ANONYMOUS AUTH] Current session user ID:', session.user.id);
        console.log('[ANONYMOUS AUTH] Session user:', session.user);
        console.log('[ANONYMOUS AUTH] Is anonymous user?', isAnonymousUser(session));
        console.log('[ANONYMOUS AUTH] localStorage anonymousUserIdForMerge:', localStorage.getItem('anonymousUserIdForMerge'));
        
        // Get current cart items
        const currentItems = await getCart();
        console.log('[ANONYMOUS AUTH] Current cart items before adding:', currentItems);
        
        // Check if item already exists
        const existingItemIndex = currentItems.findIndex(cartItem => cartItem.id === item.id);
        
        if (existingItemIndex !== -1) {
            // Update quantity of existing item
            currentItems[existingItemIndex].quantity += item.quantity;
            console.log('[ANONYMOUS AUTH] Updated existing item quantity:', currentItems[existingItemIndex]);
        } else {
            // Add new item
            currentItems.push(item);
            console.log('[ANONYMOUS AUTH] Added new item to cart:', item);
        }
        
        console.log('[ANONYMOUS AUTH] Cart items after adding:', currentItems);
        console.log('[ANONYMOUS AUTH] About to upsert cart with user ID:', session.user.id);
        
        // Upsert cart in database
        const now = new Date().toISOString();
        console.log('[ANONYMOUS AUTH] About to upsert cart with data:', {
            supabase_user_id: session.user.id,
            items: currentItems,
            createdAt: now,
            updatedAt: now
        });
        
        const { data: upsertData, error: upsertError } = await supabase
            .from('Carts')
            .upsert({
                supabase_user_id: session.user.id,
                items: currentItems,
                createdAt: now,
                updatedAt: now
            }, { onConflict: 'supabase_user_id' })
            .select();
        
        console.log('[ANONYMOUS AUTH] Upsert result:', { upsertData, upsertError });
        
        if (upsertError) {
            console.error('[ANONYMOUS AUTH] ❌ Error upserting cart:', upsertError);
            return { success: false, error: upsertError.message };
        }
        
        console.log('[ANONYMOUS AUTH] ✅ Cart updated successfully, upsert data:', upsertData);
        return { success: true, items: currentItems };
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] ❌ Error in addToCart:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = async (itemId, quantity) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return { success: false, error: 'No session found' };
        }
        
        const currentItems = await getCart();
        const itemIndex = currentItems.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return { success: false, error: 'Item not found in cart' };
        }
        
        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            currentItems.splice(itemIndex, 1);
        } else {
            // Update quantity
            currentItems[itemIndex].quantity = quantity;
        }
        
        const now = new Date().toISOString();
        const { error: upsertError } = await supabase
            .from('Carts')
            .upsert({
                supabase_user_id: session.user.id,
                items: currentItems,
                createdAt: now,
                updatedAt: now
            }, { onConflict: 'supabase_user_id' });
        
        if (upsertError) {
            return { success: false, error: upsertError.message };
        }
        
        return { success: true, items: currentItems };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return { success: false, error: 'No session found' };
        }
        
        const currentItems = await getCart();
        const filteredItems = currentItems.filter(item => item.id !== itemId);
        
        const now = new Date().toISOString();
        const { error: upsertError } = await supabase
            .from('Carts')
            .upsert({
                supabase_user_id: session.user.id,
                items: filteredItems,
                createdAt: now,
                updatedAt: now
            }, { onConflict: 'supabase_user_id' });
        
        if (upsertError) {
            return { success: false, error: upsertError.message };
        }
        
        return { success: true, items: filteredItems };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Clear cart
 */
export const clearCart = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return { success: false, error: 'No session found' };
        }
        
        const now = new Date().toISOString();
        const { error: upsertError } = await supabase
            .from('Carts')
            .upsert({
                supabase_user_id: session.user.id,
                items: [],
                createdAt: now,
                updatedAt: now
            }, { onConflict: 'supabase_user_id' });
        
        if (upsertError) {
            return { success: false, error: upsertError.message };
        }
        
        return { success: true, items: [] };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Create order from cart
 */
export const createOrder = async (orderData) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return { success: false, error: 'No session found' };
        }
        
        const cartItems = await getCart();
        
        if (cartItems.length === 0) {
            return { success: false, error: 'Cart is empty' };
        }
        
        const now = new Date().toISOString();
        const { data: order, error: orderError } = await supabase
            .from('Orders')
            .insert({
                supabase_user_id: session.user.id,
                items: cartItems,
                totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                status: 'pending',
                createdAt: now,
                updatedAt: now,
                ...orderData
            })
            .select()
            .single();
        
        if (orderError) {
            return { success: false, error: orderError.message };
        }
        
        // Clear cart after successful order
        await clearCart();
        
        return { success: true, order };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Simple merge function - database only
 */
export const mergeAnonymousCartWithStoredId = async (anonymousUserId, authenticatedUserId) => {
    try {
        console.log('[ANON MERGE] 🚀 Starting enhanced cart merge...');
        console.log('[ANON MERGE] Anonymous user ID:', anonymousUserId);
        console.log('[ANON MERGE] Authenticated user ID:', authenticatedUserId);
        
        // 🎯 INPUT VALIDATION
        if (!anonymousUserId || !authenticatedUserId) {
            console.error('[ANON MERGE] ❌ Invalid user IDs provided');
            return { success: false, error: 'Invalid user IDs provided' };
        }
        
        if (anonymousUserId === authenticatedUserId) {
            console.warn('[ANON MERGE] ⚠️  Anonymous and authenticated user IDs are the same');
            return { success: false, error: 'Cannot merge cart with same user ID' };
        }
        
        // 🎯 STEP 1: Verify anonymous cart exists in database
        console.log('[ANON MERGE] 🔍 Step 1: Verifying anonymous cart exists in database...');
        const { data: anonymousCart, error: anonymousError } = await supabase
            .from('Carts')
            .select('items, updatedAt')
            .eq('supabase_user_id', anonymousUserId)
            .maybeSingle();
        
        if (anonymousError) {
            console.error('[ANON MERGE] ❌ Error fetching anonymous cart:', anonymousError);
            return { success: false, error: 'Failed to fetch anonymous cart: ' + anonymousError.message };
        }
        
        if (!anonymousCart) {
            console.log('[ANON MERGE] ℹ️  No anonymous cart found in database');
            return { success: true, mergedItems: [], message: 'No anonymous cart found' };
        }
        
        const anonymousItems = anonymousCart.items || [];
        console.log('[ANON MERGE] ✅ Anonymous cart found with', anonymousItems.length, 'items');
        console.log('[ANON MERGE] Anonymous cart items:', anonymousItems);
        console.log('[ANON MERGE] Anonymous cart last updated:', anonymousCart.updatedAt);
        
        if (anonymousItems.length === 0) {
            console.log('[ANON MERGE] ℹ️  Anonymous cart is empty, no merge needed');
            return { success: true, mergedItems: [], message: 'Anonymous cart is empty' };
        }
        
        // 🎯 STEP 2: Get authenticated user's cart from database
        console.log('[ANON MERGE] 🔍 Step 2: Fetching authenticated user cart from database...');
        const { data: authenticatedCart, error: authenticatedError } = await supabase
            .from('Carts')
            .select('items, updatedAt')
            .eq('supabase_user_id', authenticatedUserId)
            .maybeSingle();
        
        if (authenticatedError) {
            console.error('[ANON MERGE] ❌ Error fetching authenticated cart:', authenticatedError);
            return { success: false, error: 'Failed to fetch authenticated cart: ' + authenticatedError.message };
        }
        
        const authenticatedItems = authenticatedCart?.items || [];
        console.log('[ANON MERGE] ✅ Authenticated cart found with', authenticatedItems.length, 'items');
        console.log('[ANON MERGE] Authenticated cart items:', authenticatedItems);
        
        // 🎯 STEP 3: Merge carts using enhanced merge logic
        console.log('[ANON MERGE] 🔄 Step 3: Merging carts with enhanced logic...');
        const mergeResult = mergeCarts(anonymousItems, authenticatedItems);
        console.log('[ANON MERGE] ✅ Merge completed:', mergeResult);
        
        // 🎯 STEP 4: Save merged cart to authenticated user
        console.log('[ANON MERGE] 💾 Step 4: Saving merged cart to authenticated user...');
        const now = new Date().toISOString();
        const { data: savedCart, error: saveError } = await supabase
            .from('Carts')
            .upsert({
                supabase_user_id: authenticatedUserId,
                items: mergeResult.mergedItems,
                createdAt: now,
                updatedAt: now
            }, { onConflict: 'supabase_user_id' })
            .select();
        
        if (saveError) {
            console.error('[ANON MERGE] ❌ Error saving merged cart:', saveError);
            return { success: false, error: 'Failed to save merged cart: ' + saveError.message };
        }
        
        console.log('[ANON MERGE] ✅ Merged cart saved successfully');
        console.log('[ANON MERGE] Final cart items count:', mergeResult.mergedItems.length);
        
        // 🎯 STEP 5: Clean up anonymous cart with error handling
        console.log('[ANON MERGE] 🧹 Step 5: Cleaning up anonymous cart...');
        const { error: deleteError } = await supabase
            .from('Carts')
            .delete()
            .eq('supabase_user_id', anonymousUserId);
        
        if (deleteError) {
            console.error('[ANON MERGE] ⚠️  Error deleting anonymous cart:', deleteError);
            // Don't fail the merge if cleanup fails, but log it
        } else {
            console.log('[ANON MERGE] ✅ Anonymous cart deleted successfully');
        }
        
        // 🎯 STEP 6: Return success with detailed information
        console.log('[ANON MERGE] ✅ Cart merge completed successfully');
        console.log('[ANON MERGE] Summary:', {
            anonymousItemsCount: anonymousItems.length,
            authenticatedItemsCount: authenticatedItems.length,
            mergedItemsCount: mergeResult.mergedItems.length,
            itemsAdded: mergeResult.itemsAdded,
            quantitiesCombined: mergeResult.quantitiesCombined
        });
        
        return { 
            success: true, 
            mergedItems: mergeResult.mergedItems,
            summary: {
                anonymousItemsCount: anonymousItems.length,
                authenticatedItemsCount: authenticatedItems.length,
                mergedItemsCount: mergeResult.mergedItems.length,
                itemsAdded: mergeResult.itemsAdded,
                quantitiesCombined: mergeResult.quantitiesCombined
            }
        };
        
    } catch (error) {
        console.error('[ANON MERGE] ❌ Merge operation failed:', error);
        return { success: false, error: 'Merge operation failed: ' + error.message };
    }
};

// 🎯 ENHANCED MERGE LOGIC WITH DETAILED LOGGING AND COUNTERS
function mergeCarts(anonymousItems, authenticatedItems) {
    console.log('[MERGE LOGIC] 🔄 Starting enhanced cart merge logic...');
    console.log('[MERGE LOGIC] Anonymous items:', anonymousItems);
    console.log('[MERGE LOGIC] Authenticated items:', authenticatedItems);
    
    const mergedItems = [...authenticatedItems];
    let itemsAdded = 0;
    let quantitiesCombined = 0;
    let itemsSkipped = 0;
    
    anonymousItems.forEach((anonymousItem, index) => {
        console.log(`[MERGE LOGIC] Processing anonymous item ${index + 1}/${anonymousItems.length}:`, anonymousItem);
        
        // Validate item structure
        if (!anonymousItem.id) {
            console.warn(`[MERGE LOGIC] ⚠️  Skipping item without ID:`, anonymousItem);
            itemsSkipped++;
            return;
        }
        
        const existingIndex = mergedItems.findIndex(item => item.id === anonymousItem.id);
        
        if (existingIndex !== -1) {
            // Item exists - combine quantities
            const oldQuantity = mergedItems[existingIndex].quantity;
            const addedQuantity = anonymousItem.quantity || 1;
            mergedItems[existingIndex].quantity += addedQuantity;
            quantitiesCombined++;
            
            console.log(`[MERGE LOGIC] ✅ Combined quantities for item ${anonymousItem.id}:`, {
                oldQuantity,
                addedQuantity,
                newQuantity: mergedItems[existingIndex].quantity
            });
        } else {
            // New item - add to cart
            const itemToAdd = {
                ...anonymousItem,
                quantity: anonymousItem.quantity || 1
            };
            mergedItems.push(itemToAdd);
            itemsAdded++;
            
            console.log(`[MERGE LOGIC] ✅ Added new item ${anonymousItem.id}:`, itemToAdd);
        }
    });
    
    const result = {
        mergedItems,
        itemsAdded,
        quantitiesCombined,
        itemsSkipped
    };
    
    console.log('[MERGE LOGIC] ✅ Enhanced merge logic completed:', result);
    return result;
}

export default {
    initializeAnonymousAuth,
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    mergeAnonymousCartWithStoredId,
    isAnonymousUser
}; 