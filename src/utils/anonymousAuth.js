/**
 * Anonymous Authentication Implementation
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Supabase-native anonymous auth handling:
 * - Automatic anonymous sign-in for unauthenticated users
 * - Cart persistence in Supabase Carts table
 * - Identity linking when user logs in
 * - No localStorage required - everything in Supabase
 */

import { supabase } from './supabaseClient';

/**
 * Initialize anonymous authentication
 * Called on app load if no session exists
 */
export const initializeAnonymousAuth = async () => {
    try {
        console.log('[ANONYMOUS AUTH] Checking for existing session...');
        
        // Check if user already has a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            console.log('[ANONYMOUS AUTH] Existing session found:', session.user.id);
            console.log('[ANONYMOUS AUTH] Session user details:', session.user);
            return { session, isAnonymous: session.user.app_metadata?.is_anonymous || false };
        }
        
        // No session exists, sign in anonymously
        console.log('[ANONYMOUS AUTH] No session found, signing in anonymously...');
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
            console.error('[ANONYMOUS AUTH] Anonymous sign-in failed:', error);
            throw error;
        }
        
        console.log('[ANONYMOUS AUTH] Anonymous sign-in successful:', data.user.id);
        console.log('[ANONYMOUS AUTH] Anonymous user details:', data.user);
        return { session: data.session, isAnonymous: true };
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] Failed to initialize anonymous auth:', error);
        throw error;
    }
};

/**
 * Link anonymous user to permanent account (Google OAuth)
 * Called when anonymous user logs in with Google
 */
export const linkAnonymousToGoogle = async () => {
    try {
        console.log('[ANONYMOUS AUTH] Linking anonymous user to Google...');
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user.app_metadata?.is_anonymous) {
            console.log('[ANONYMOUS AUTH] No anonymous session found');
            return { success: false, error: 'No anonymous session found' };
        }
        
        const anonymousUserId = session.user.id;
        console.log('[ANONYMOUS AUTH] Anonymous user ID:', anonymousUserId);
        
        // Link identity to Google
        const { data, error } = await supabase.auth.linkIdentity({
            provider: 'google'
        });
        
        if (error) {
            console.error('[ANONYMOUS AUTH] Identity linking failed:', error);
            return { success: false, error: error.message };
        }
        
        console.log('[ANONYMOUS AUTH] Identity linked successfully');
        
        // Get the new session with permanent user
        const { data: { session: newSession } } = await supabase.auth.getSession();
        
        if (newSession && !newSession.user.app_metadata?.is_anonymous) {
            console.log('[ANONYMOUS AUTH] User converted to permanent:', newSession.user.id);
            
            // Cart data is automatically transferred by Supabase
            // The anonymous cart becomes the permanent user's cart
            
            return { 
                success: true, 
                session: newSession,
                anonymousUserId,
                permanentUserId: newSession.user.id
            };
        }
        
        return { success: false, error: 'Failed to get new session' };
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] Link to Google failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if current user is anonymous
 * Anonymous users in Supabase have empty email and phone fields
 */
export const isAnonymousUser = (session) => {
    if (!session?.user) return false;
    
    // Anonymous users have empty email and phone
    const hasEmail = session.user.email && session.user.email.trim() !== '';
    const hasPhone = session.user.phone && session.user.phone.trim() !== '';
    
    // Also check for the app_metadata flag (though it's not always set)
    const hasAnonymousFlag = session.user.app_metadata?.is_anonymous || false;
    
    // User is anonymous if they have no email, no phone, or have the anonymous flag
    return !hasEmail && !hasPhone || hasAnonymousFlag;
};

/**
 * Get cart for current user (anonymous or permanent)
 */
export const getCart = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            console.log('[ANONYMOUS AUTH] No session found for cart');
            return [];
        }
        
        console.log('[ANONYMOUS AUTH] Fetching cart for user:', session.user.id);
        
        // Fetch cart from Supabase Carts table
        const { data: cart, error } = await supabase
            .from('Carts')
            .select('items')
            .eq('supabase_user_id', session.user.id)
            .maybeSingle();
        
        if (error) {
            console.error('[ANONYMOUS AUTH] Error fetching cart:', error);
            return [];
        }
        
        if (!cart) {
            // No cart found - this is normal for new users
            console.log('[ANONYMOUS AUTH] No cart found for user (normal for new users)');
            return [];
        }
        
        const items = cart?.items || [];
        console.log('[ANONYMOUS AUTH] Cart items:', items);
        return items;
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] Failed to get cart:', error);
        return [];
    }
};

/**
 * Add item to cart (anonymous or permanent)
 */
export const addToCart = async (item) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            console.error('[ANONYMOUS AUTH] No session found for cart operation');
            return { success: false, error: 'No session found' };
        }
        
        console.log('[ANONYMOUS AUTH] Adding item to cart:', item);
        console.log('[ANONYMOUS AUTH] Current session user ID:', session.user.id);
        console.log('[ANONYMOUS AUTH] Session user:', session.user);
        
        // Get current cart
        const { data: existingCart, error: fetchError } = await supabase
            .from('Carts')
            .select('items')
            .eq('supabase_user_id', session.user.id)
            .maybeSingle();
        
        let currentItems = [];
        if (!fetchError && existingCart) {
            currentItems = existingCart.items || [];
        }
        
        // Add or update item
        const existingIndex = currentItems.findIndex(i => i.id === item.id);
        if (existingIndex !== -1) {
            currentItems[existingIndex] = { 
                ...currentItems[existingIndex], 
                quantity: currentItems[existingIndex].quantity + item.quantity 
            };
        } else {
            currentItems.push({ ...item });
        }
        
        console.log('[ANONYMOUS AUTH] About to upsert cart with user ID:', session.user.id);
        console.log('[ANONYMOUS AUTH] Cart items to save:', currentItems);
        
        // Upsert cart with timestamps
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
            console.error('[ANONYMOUS AUTH] Failed to update cart:', upsertError);
            return { success: false, error: upsertError.message };
        }
        
        console.log('[ANONYMOUS AUTH] Cart updated successfully');
        return { success: true, items: currentItems };
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] Failed to add to cart:', error);
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
        
        // Get current cart
        const { data: cart, error: fetchError } = await supabase
            .from('Carts')
            .select('items')
            .eq('supabase_user_id', session.user.id)
            .maybeSingle();
        
        if (fetchError) {
            return { success: false, error: fetchError.message };
        }
        
        let items = cart?.items || [];
        
        // Update quantity
        items = items.map(item => 
            item.id === itemId ? { ...item, quantity } : item
        );
        
        // Remove items with quantity 0
        items = items.filter(item => item.quantity > 0);
        
        // Update cart with timestamp
        const { error: updateError } = await supabase
            .from('Carts')
            .update({ 
                items,
                updatedAt: new Date().toISOString()
            })
            .eq('supabase_user_id', session.user.id);
        
        if (updateError) {
            return { success: false, error: updateError.message };
        }
        
        return { success: true, items };
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] Failed to update quantity:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId) => {
    return updateCartItemQuantity(itemId, 0);
};

/**
 * Clear entire cart
 */
export const clearCart = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return { success: false, error: 'No session found' };
        }
        
        const { error } = await supabase
            .from('Carts')
            .update({ 
                items: [],
                updatedAt: new Date().toISOString()
            })
            .eq('supabase_user_id', session.user.id);
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return { success: true, items: [] };
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] Failed to clear cart:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Create order from cart (checkout)
 */
export const createOrder = async (orderData) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return { success: false, error: 'No session found' };
        }
        
        // Get cart items
        const { data: cart, error: cartError } = await supabase
            .from('Carts')
            .select('items')
            .eq('supabase_user_id', session.user.id)
            .maybeSingle();
        
        if (cartError || !cart?.items?.length) {
            return { success: false, error: 'Cart is empty' };
        }
        
        // Calculate total
        const totalAmount = cart.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );
        
        // Create order with timestamps
        const now = new Date().toISOString();
        const { data: order, error: orderError } = await supabase
            .from('Orders')
            .insert({
                supabase_user_id: session.user.id,
                items: cart.items,
                totalAmount,
                status: 'pending',
                shippingAddress: orderData.shippingAddress || {
                    street: '123 Main St',
                    city: 'Anytown',
                    state: 'CA',
                    zipCode: '12345',
                    country: 'USA'
                },
                paymentMethod: orderData.paymentMethod || 'credit_card',
                createdAt: now,
                updatedAt: now
            })
            .select()
            .single();
        
        if (orderError) {
            console.error('[ANONYMOUS AUTH] Failed to create order:', orderError);
            return { success: false, error: orderError.message };
        }
        
        // Clear cart after successful order
        await clearCart();
        
        console.log('[ANONYMOUS AUTH] Order created successfully:', order.id);
        return { success: true, order };
        
    } catch (error) {
        console.error('[ANONYMOUS AUTH] Failed to create order:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Merge anonymous cart with authenticated cart using stored anonymous user ID
 * This is used when anonymous user logs in via OAuth
 */
export const mergeAnonymousCartWithStoredId = async (anonymousUserId, authenticatedUserId) => {
    try {
        console.log('[ANON MERGE] Starting merge: anon:', anonymousUserId, 'auth:', authenticatedUserId);
        if (!anonymousUserId || !authenticatedUserId) {
            console.warn('[ANON MERGE] Missing user IDs, aborting merge.');
            return;
        }
        // Fetch anonymous cart
        const { data: anonCart, error: anonErr } = await supabase
            .from('Carts')
            .select('items')
            .eq('supabase_user_id', anonymousUserId)
            .maybeSingle();
        console.log('[ANON MERGE] Fetched anon cart:', anonCart, 'error:', anonErr);
        if (anonErr || !anonCart || !anonCart.items || anonCart.items.length === 0) {
            console.log('[ANON MERGE] No anon cart to merge.');
            localStorage.removeItem('anonymousUserIdForMerge');
            return;
        }
        // Fetch authenticated cart
        const { data: authCart, error: authErr } = await supabase
            .from('Carts')
            .select('items')
            .eq('supabase_user_id', authenticatedUserId)
            .maybeSingle();
        console.log('[ANON MERGE] Fetched auth cart:', authCart, 'error:', authErr);
        let mergedItems = [...anonCart.items];
        if (authCart && authCart.items && authCart.items.length > 0) {
            // Merge logic: combine, dedupe by product ID (or whatever key you use)
            const existingIds = new Set(anonCart.items.map(i => i.product_id));
            mergedItems = [
                ...anonCart.items,
                ...authCart.items.filter(i => !existingIds.has(i.product_id))
            ];
        }
        // Update authenticated cart
        const { error: updateErr } = await supabase
            .from('Carts')
            .upsert({ supabase_user_id: authenticatedUserId, items: mergedItems }, { onConflict: ['supabase_user_id'] });
        console.log('[ANON MERGE] Updated auth cart, error:', updateErr);
        // Delete anonymous cart
        const { error: delErr } = await supabase
            .from('Carts')
            .delete()
            .eq('supabase_user_id', anonymousUserId);
        console.log('[ANON MERGE] Deleted anon cart, error:', delErr);
        // Remove localStorage key
        localStorage.removeItem('anonymousUserIdForMerge');
        console.log('[ANON MERGE] Merge complete.');
    } catch (e) {
        console.error('[ANON MERGE] Exception during merge:', e);
        localStorage.removeItem('anonymousUserIdForMerge');
    }
};

// Utility function to merge two cart arrays
function mergeCarts(localItems, serverItems) {
    const merged = [...serverItems];
    
    localItems.forEach(localItem => {
        const existingIndex = merged.findIndex(item => item.id === localItem.id);
        
        if (existingIndex >= 0) {
            // Item exists, add quantities
            merged[existingIndex] = {
                ...merged[existingIndex],
                quantity: merged[existingIndex].quantity + localItem.quantity
            };
        } else {
            // New item, add to cart
            merged.push(localItem);
        }
    });
    
    return merged;
}

export default {
    initializeAnonymousAuth,
    linkAnonymousToGoogle,
    isAnonymousUser,
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    mergeAnonymousCartWithStoredId
}; 