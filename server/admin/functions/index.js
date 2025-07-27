/**
 * Admin Functions Index
 * Author: Justin Linzan
 * Date: January 2025
 * 
 * Central export file for all admin functions
 */

const cartAccess = require('./adminCartAccess');
const userManagement = require('./adminUserManagement');

// Export all admin functions
module.exports = {
    // Cart management functions
    isAdminUser: cartAccess.isAdminUser,
    getAllCartsAdmin: cartAccess.getAllCartsAdmin,
    getCartByUserIdAdmin: cartAccess.getCartByUserIdAdmin,
    updateCartItemsAdmin: cartAccess.updateCartItemsAdmin,
    deleteCartAdmin: cartAccess.deleteCartAdmin,
    getCartStatisticsAdmin: cartAccess.getCartStatisticsAdmin,
    
    // User management functions
    getAllUsersAdmin: userManagement.getAllUsersAdmin,
    updateUserRoleAdmin: userManagement.updateUserRoleAdmin,
    getUserStatisticsAdmin: userManagement.getUserStatisticsAdmin,
    deleteUserAdmin: userManagement.deleteUserAdmin,
    
    // Individual modules for specific imports
    cartAccess,
    userManagement
}; 