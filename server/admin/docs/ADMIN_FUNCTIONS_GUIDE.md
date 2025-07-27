# Admin Functions Guide

**Author:** Justin Linzan  
**Date:** January 2025  
**Status:** ✅ ACTIVE

## Overview

This guide documents the admin functions available for managing carts, users, and system administration. All functions require admin privileges and include proper security validation.

## Directory Structure

```
server/admin/
├── functions/
│   ├── adminCartAccess.js      # Cart management functions
│   └── adminUserManagement.js  # User management functions
├── docs/
│   ├── ADMIN_FUNCTIONS_GUIDE.md    # This guide
│   └── RLS_AND_CART_FIXES_SUMMARY.md  # Fix documentation
└── migrations/
    └── [database migration files]
```

## Cart Management Functions

### `isAdminUser(session)`
**Purpose:** Check if current user has admin privileges  
**Parameters:** `session` - Supabase session object  
**Returns:** `boolean` - True if user is admin

**Usage:**
```javascript
const { isAdminUser } = require('./adminCartAccess');
const isAdmin = await isAdminUser(session);
```

**Authentication Methods:**
1. **JWT Role Check** - Checks `session.user.user_metadata.role`
2. **Users Table Fallback** - Queries Users table for role verification

### `getAllCartsAdmin(session)`
**Purpose:** Get all carts with user information (admin only)  
**Parameters:** `session` - Supabase session object  
**Returns:** `Object` - Result with carts data or error

**Response Format:**
```javascript
{
  success: true,
  carts: [
    {
      id: 1,
      items: [...],
      createdAt: "2025-01-...",
      updatedAt: "2025-01-...",
      Users: {
        id: 1,
        email: "user@example.com",
        role: "end_user"
      }
    }
  ],
  count: 42
}
```

### `getCartByUserIdAdmin(session, userId)`
**Purpose:** Get cart for specific user (admin only)  
**Parameters:** 
- `session` - Supabase session object
- `userId` - User ID to get cart for  
**Returns:** `Object` - Result with cart data or error

### `updateCartItemsAdmin(session, cartId, items)`
**Purpose:** Update cart items (admin only)  
**Parameters:** 
- `session` - Supabase session object
- `cartId` - Cart ID to update
- `items` - Array of new cart items  
**Returns:** `Object` - Result with success/error

### `deleteCartAdmin(session, cartId)`
**Purpose:** Delete cart (admin only)  
**Parameters:** 
- `session` - Supabase session object
- `cartId` - Cart ID to delete  
**Returns:** `Object` - Result with success/error

### `getCartStatisticsAdmin(session)`
**Purpose:** Get cart statistics (admin only)  
**Parameters:** `session` - Supabase session object  
**Returns:** `Object` - Result with statistics or error

**Statistics Include:**
- Total carts
- Total items across all carts
- Recent carts (last 7 days)
- Average items per cart

## User Management Functions

### `getAllUsersAdmin(session)`
**Purpose:** Get all users (admin only)  
**Parameters:** `session` - Supabase session object  
**Returns:** `Object` - Result with users data or error

### `updateUserRoleAdmin(session, userId, newRole)`
**Purpose:** Update user role (admin only)  
**Parameters:** 
- `session` - Supabase session object
- `userId` - User ID to update
- `newRole` - New role (admin, end_user, seller)  
**Returns:** `Object` - Result with success/error

**Valid Roles:**
- `admin` - Full administrative access
- `end_user` - Regular user access
- `seller` - Seller access (if applicable)

### `getUserStatisticsAdmin(session)`
**Purpose:** Get user statistics (admin only)  
**Parameters:** `session` - Supabase session object  
**Returns:** `Object` - Result with statistics or error

**Statistics Include:**
- Total users
- Users by role (admin, end_user, seller)
- Recent users (last 7 days)
- Role distribution

### `deleteUserAdmin(session, userId)`
**Purpose:** Delete user (admin only)  
**Parameters:** 
- `session` - Supabase session object
- `userId` - User ID to delete  
**Returns:** `Object` - Result with success/error

## Security Features

### Admin Privilege Verification
All functions verify admin privileges before execution:
```javascript
const isAdmin = await isAdminUser(session);
if (!isAdmin) {
    return {
        success: false,
        error: 'Access denied: Admin privileges required'
    };
}
```

### Multiple Authentication Methods
1. **JWT Role Check** - Primary method
2. **Users Table Lookup** - Fallback method
3. **Email-based Verification** - Additional validation

### Error Handling
All functions include comprehensive error handling:
- Database connection errors
- Permission denied errors
- Invalid data errors
- Network timeout errors

## Usage Examples

### Get All Carts for Debugging
```javascript
const { getAllCartsAdmin } = require('./adminCartAccess');

const result = await getAllCartsAdmin(session);
if (result.success) {
    console.log(`Found ${result.count} carts`);
    result.carts.forEach(cart => {
        console.log(`Cart ${cart.id}: ${cart.items.length} items`);
    });
} else {
    console.error('Error:', result.error);
}
```

### Update User Role
```javascript
const { updateUserRoleAdmin } = require('./adminUserManagement');

const result = await updateUserRoleAdmin(session, userId, 'admin');
if (result.success) {
    console.log('User role updated successfully');
} else {
    console.error('Error:', result.error);
}
```

### Get System Statistics
```javascript
const { getCartStatisticsAdmin, getUserStatisticsAdmin } = require('./admin');

const cartStats = await getCartStatisticsAdmin(session);
const userStats = await getUserStatisticsAdmin(session);

console.log('Cart Statistics:', cartStats.statistics);
console.log('User Statistics:', userStats.statistics);
```

## Integration with API Routes

### Express Route Example
```javascript
const express = require('express');
const router = express.Router();
const { getAllCartsAdmin } = require('../admin/functions/adminCartAccess');

router.get('/admin/carts', async (req, res) => {
    const session = req.session; // Get from your auth middleware
    const result = await getAllCartsAdmin(session);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(403).json(result);
    }
});
```

## Testing Admin Functions

### Test Admin Access
```javascript
const { isAdminUser } = require('./adminCartAccess');

// Test with valid admin session
const isAdmin = await isAdminUser(adminSession);
console.log('Is admin:', isAdmin); // Should be true

// Test with regular user session
const isAdmin = await isAdminUser(userSession);
console.log('Is admin:', isAdmin); // Should be false
```

### Test Cart Access
```javascript
const { getAllCartsAdmin } = require('./adminCartAccess');

// Test admin cart access
const result = await getAllCartsAdmin(adminSession);
console.log('Admin access result:', result.success);
```

## Error Codes and Messages

### Common Error Messages
- `"Access denied: Admin privileges required"` - User not admin
- `"Invalid role. Must be one of: admin, end_user, seller"` - Invalid role
- `"Items must be an array"` - Invalid cart items format
- `"User not found"` - User ID doesn't exist

### Error Handling Best Practices
```javascript
const result = await someAdminFunction(session, params);
if (result.success) {
    // Handle success
    console.log(result.data);
} else {
    // Handle error
    console.error('Admin function error:', result.error);
    
    // Check specific error types
    if (result.error.includes('Access denied')) {
        // Handle permission error
    } else if (result.error.includes('not found')) {
        // Handle not found error
    }
}
```

## Performance Considerations

### Database Queries
- Functions use optimized queries with proper joins
- Results are ordered by most recent first
- Pagination can be added for large datasets

### Caching
- Consider caching admin statistics
- Cache user role verification results
- Implement cache invalidation on role changes

## Monitoring and Logging

### Admin Action Logging
All admin functions log their actions:
```javascript
console.log('[ADMIN] User role updated:', { userId, newRole });
console.log('[ADMIN] Cart accessed:', { cartId, adminId });
```

### Error Monitoring
Errors are logged with context:
```javascript
console.error('[ADMIN] Error updating user role:', error);
console.error('[ADMIN] Error fetching carts:', error);
```

## Future Enhancements

### Planned Features
1. **Audit Trail** - Log all admin actions
2. **Bulk Operations** - Update multiple users/carts
3. **Advanced Statistics** - More detailed analytics
4. **Export Functions** - Export data for analysis

### Security Enhancements
1. **Rate Limiting** - Prevent abuse of admin functions
2. **Action Confirmation** - Require confirmation for destructive actions
3. **IP Whitelisting** - Restrict admin access to specific IPs

---

**Status:** ✅ **ACTIVE**  
**Last Updated:** January 2025  
**Maintainer:** Justin Linzan 