/**
 * Admin Cart Access Functions
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Functions for admin users to access and manage cart data
 * These functions bypass RLS policies for administrative purposes
 */

const { supabase } = require('../../db/database');

/**
 * Check if current user has admin privileges
 * @param {Object} session - Supabase session object
 * @returns {boolean} - True if user is admin
 */
const isAdminUser = async (session) => {
    try {
        if (!session?.user) {
            return false;
        }

        // Check JWT role first
        const jwtRole = session.user.user_metadata?.role;
        if (jwtRole === 'admin') {
            return true;
        }

        // Fallback: Check Users table
        const { data: user, error } = await supabase
            .from('Users')
            .select('role')
            .or(`supabase_user_id.eq.${session.user.id},email.eq.${session.user.email}`)
            .single();

        if (error) {
            console.error('[ADMIN] Error checking user role:', error);
            return false;
        }

        return user?.role === 'admin';
    } catch (error) {
        console.error('[ADMIN] Error in isAdminUser:', error);
        return false;
    }
};

/**
 * Get all carts (admin only)
 * @param {Object} session - Supabase session object
 * @returns {Object} - Result with carts data or error
 */
const getAllCartsAdmin = async (session) => {
    try {
        // Verify admin privileges
        const isAdmin = await isAdminUser(session);
        if (!isAdmin) {
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Get all carts with user information
        const { data: carts, error } = await supabase
            .from('Carts')
            .select(`
                id,
                items,
                createdAt,
                updatedAt,
                Users!Carts_UserId_fkey (
                    id,
                    email,
                    role
                )
            `)
            .order('updatedAt', { ascending: false });

        if (error) {
            console.error('[ADMIN] Error fetching carts:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            carts: carts || [],
            count: carts?.length || 0
        };
    } catch (error) {
        console.error('[ADMIN] Error in getAllCartsAdmin:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get cart by user ID (admin only)
 * @param {Object} session - Supabase session object
 * @param {string} userId - User ID to get cart for
 * @returns {Object} - Result with cart data or error
 */
const getCartByUserIdAdmin = async (session, userId) => {
    try {
        // Verify admin privileges
        const isAdmin = await isAdminUser(session);
        if (!isAdmin) {
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Get cart for specific user
        const { data: cart, error } = await supabase
            .from('Carts')
            .select(`
                id,
                items,
                createdAt,
                updatedAt,
                Users!Carts_UserId_fkey (
                    id,
                    email,
                    role
                )
            `)
            .or(`supabase_user_id.eq.${userId},userId.eq.${userId}`)
            .single();

        if (error) {
            console.error('[ADMIN] Error fetching user cart:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            cart: cart
        };
    } catch (error) {
        console.error('[ADMIN] Error in getCartByUserIdAdmin:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Update cart items (admin only)
 * @param {Object} session - Supabase session object
 * @param {string} cartId - Cart ID to update
 * @param {Array} items - New cart items
 * @returns {Object} - Result with success/error
 */
const updateCartItemsAdmin = async (session, cartId, items) => {
    try {
        // Verify admin privileges
        const isAdmin = await isAdminUser(session);
        if (!isAdmin) {
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Validate items
        if (!Array.isArray(items)) {
            return {
                success: false,
                error: 'Items must be an array'
            };
        }

        // Update cart
        const { data, error } = await supabase
            .from('Carts')
            .update({
                items: items,
                updatedAt: new Date().toISOString()
            })
            .eq('id', cartId)
            .select();

        if (error) {
            console.error('[ADMIN] Error updating cart:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            cart: data[0]
        };
    } catch (error) {
        console.error('[ADMIN] Error in updateCartItemsAdmin:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Delete cart (admin only)
 * @param {Object} session - Supabase session object
 * @param {string} cartId - Cart ID to delete
 * @returns {Object} - Result with success/error
 */
const deleteCartAdmin = async (session, cartId) => {
    try {
        // Verify admin privileges
        const isAdmin = await isAdminUser(session);
        if (!isAdmin) {
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Delete cart
        const { error } = await supabase
            .from('Carts')
            .delete()
            .eq('id', cartId);

        if (error) {
            console.error('[ADMIN] Error deleting cart:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            message: 'Cart deleted successfully'
        };
    } catch (error) {
        console.error('[ADMIN] Error in deleteCartAdmin:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get cart statistics (admin only)
 * @param {Object} session - Supabase session object
 * @returns {Object} - Result with statistics or error
 */
const getCartStatisticsAdmin = async (session) => {
    try {
        // Verify admin privileges
        const isAdmin = await isAdminUser(session);
        if (!isAdmin) {
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Get cart statistics
        const { data: carts, error } = await supabase
            .from('Carts')
            .select('id, items, createdAt, updatedAt');

        if (error) {
            console.error('[ADMIN] Error fetching cart statistics:', error);
            return {
                success: false,
                error: error.message
            };
        }

        // Calculate statistics
        const totalCarts = carts?.length || 0;
        const totalItems = carts?.reduce((sum, cart) => {
            return sum + (cart.items?.length || 0);
        }, 0) || 0;

        const recentCarts = carts?.filter(cart => {
            const updatedAt = new Date(cart.updatedAt);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return updatedAt > oneWeekAgo;
        }).length || 0;

        return {
            success: true,
            statistics: {
                totalCarts,
                totalItems,
                recentCarts,
                averageItemsPerCart: totalCarts > 0 ? (totalItems / totalCarts).toFixed(2) : 0
            }
        };
    } catch (error) {
        console.error('[ADMIN] Error in getCartStatisticsAdmin:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    isAdminUser,
    getAllCartsAdmin,
    getCartByUserIdAdmin,
    updateCartItemsAdmin,
    deleteCartAdmin,
    getCartStatisticsAdmin
}; 