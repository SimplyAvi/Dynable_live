/**
 * Admin User Management Functions
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Functions for admin users to manage user accounts and roles
 */

const { supabase } = require('../../db/database');

/**
 * Get all users (admin only)
 * @param {Object} session - Supabase session object
 * @returns {Object} - Result with users data or error
 */
const getAllUsersAdmin = async (session) => {
    try {
        // Verify admin privileges
        const isAdmin = await require('./adminCartAccess').isAdminUser(session);
        if (!isAdmin) {
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Get all users
        const { data: users, error } = await supabase
            .from('Users')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('[ADMIN] Error fetching users:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            users: users || [],
            count: users?.length || 0
        };
    } catch (error) {
        console.error('[ADMIN] Error in getAllUsersAdmin:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Update user role (admin only)
 * @param {Object} session - Supabase session object
 * @param {string} userId - User ID to update
 * @param {string} newRole - New role (admin, end_user, seller)
 * @returns {Object} - Result with success/error
 */
const updateUserRoleAdmin = async (session, userId, newRole) => {
    try {
        // Verify admin privileges
        const isAdmin = await require('./adminCartAccess').isAdminUser(session);
        if (!isAdmin) {
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Validate role
        const validRoles = ['admin', 'end_user', 'seller'];
        if (!validRoles.includes(newRole)) {
            return {
                success: false,
                error: 'Invalid role. Must be one of: admin, end_user, seller'
            };
        }

        // Update user role
        const { data, error } = await supabase
            .from('Users')
            .update({ role: newRole })
            .eq('id', userId)
            .select();

        if (error) {
            console.error('[ADMIN] Error updating user role:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            user: data[0]
        };
    } catch (error) {
        console.error('[ADMIN] Error in updateUserRoleAdmin:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get user statistics (admin only)
 * @param {Object} session - Supabase session object
 * @returns {Object} - Result with statistics or error
 */
const getUserStatisticsAdmin = async (session) => {
    try {
        // Verify admin privileges
        const isAdmin = await require('./adminCartAccess').isAdminUser(session);
        if (!isAdmin) {
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Get user statistics
        const { data: users, error } = await supabase
            .from('Users')
            .select('role, createdAt');

        if (error) {
            console.error('[ADMIN] Error fetching user statistics:', error);
            return {
                success: false,
                error: error.message
            };
        }

        // Calculate statistics
        const totalUsers = users?.length || 0;
        const adminUsers = users?.filter(user => user.role === 'admin').length || 0;
        const endUsers = users?.filter(user => user.role === 'end_user').length || 0;
        const sellerUsers = users?.filter(user => user.role === 'seller').length || 0;

        const recentUsers = users?.filter(user => {
            const createdAt = new Date(user.createdAt);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return createdAt > oneWeekAgo;
        }).length || 0;

        return {
            success: true,
            statistics: {
                totalUsers,
                adminUsers,
                endUsers,
                sellerUsers,
                recentUsers,
                roleDistribution: {
                    admin: adminUsers,
                    end_user: endUsers,
                    seller: sellerUsers
                }
            }
        };
    } catch (error) {
        console.error('[ADMIN] Error in getUserStatisticsAdmin:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Delete user (admin only)
 * @param {Object} session - Supabase session object
 * @param {string} userId - User ID to delete
 * @returns {Object} - Result with success/error
 */
const deleteUserAdmin = async (session, userId) => {
    try {
        // Verify admin privileges
        const isAdmin = await require('./adminCartAccess').isAdminUser(session);
        if (!isAdmin) {
            return {
                success: false,
                error: 'Access denied: Admin privileges required'
            };
        }

        // Delete user
        const { error } = await supabase
            .from('Users')
            .delete()
            .eq('id', userId);

        if (error) {
            console.error('[ADMIN] Error deleting user:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            message: 'User deleted successfully'
        };
    } catch (error) {
        console.error('[ADMIN] Error in deleteUserAdmin:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    getAllUsersAdmin,
    updateUserRoleAdmin,
    getUserStatisticsAdmin,
    deleteUserAdmin
}; 