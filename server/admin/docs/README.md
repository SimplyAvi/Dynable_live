# Admin Documentation

**Author:** Justin Linzan  
**Date:** January 2025  
**Status:** ✅ ACTIVE

## Overview

This directory contains comprehensive documentation for admin functions, security fixes, and system administration tools.

## Documentation Structure

```
server/admin/docs/
├── README.md                           # This file
├── ADMIN_FUNCTIONS_GUIDE.md           # Complete admin functions guide
└── RLS_AND_CART_FIXES_SUMMARY.md     # RLS and cart fixes documentation
```

## Quick Navigation

### 🔧 Admin Functions
- **[ADMIN_FUNCTIONS_GUIDE.md](ADMIN_FUNCTIONS_GUIDE.md)** - Complete guide to admin functions
  - Cart management functions
  - User management functions
  - Security features
  - Usage examples
  - Error handling

### 🛡️ Security Fixes
- **[RLS_AND_CART_FIXES_SUMMARY.md](RLS_AND_CART_FIXES_SUMMARY.md)** - RLS and cart fixes documentation
  - Admin access blocking fixes
  - Cart price data type fixes
  - Database migrations
  - Frontend updates

## Admin Functions Overview

### Cart Management
- `getAllCartsAdmin()` - Get all carts (admin only)
- `getCartByUserIdAdmin()` - Get cart for specific user
- `updateCartItemsAdmin()` - Update cart items
- `deleteCartAdmin()` - Delete cart
- `getCartStatisticsAdmin()` - Get cart statistics

### User Management
- `getAllUsersAdmin()` - Get all users (admin only)
- `updateUserRoleAdmin()` - Update user role
- `getUserStatisticsAdmin()` - Get user statistics
- `deleteUserAdmin()` - Delete user

### Security Functions
- `isAdminUser()` - Check admin privileges
- Multiple authentication methods
- Comprehensive error handling

## Recent Fixes

### ✅ RLS Policy Fixes
- **Admin Access** - Fixed admin user blocking
- **Multiple Auth Methods** - JWT + Users table fallback
- **Security Maintained** - Proper access controls

### ✅ Cart Data Fixes
- **Price Data Types** - All prices now numeric
- **Frontend Safety** - Safe price formatting
- **Error Prevention** - No more crashes

## Usage Examples

### Check Admin Status
```javascript
const { isAdminUser } = require('../functions/adminCartAccess');
const isAdmin = await isAdminUser(session);
```

### Get All Carts
```javascript
const { getAllCartsAdmin } = require('../functions/adminCartAccess');
const result = await getAllCartsAdmin(session);
```

### Update User Role
```javascript
const { updateUserRoleAdmin } = require('../functions/adminUserManagement');
const result = await updateUserRoleAdmin(session, userId, 'admin');
```

## Security Features

### Admin Privilege Verification
- JWT role checking
- Users table fallback
- Email-based verification

### Error Handling
- Comprehensive error messages
- Graceful degradation
- Detailed logging

### Data Validation
- Input sanitization
- Type checking
- Format validation

## Testing

### Admin Access Testing
```javascript
// Test admin functions
const { isAdminUser, getAllCartsAdmin } = require('../functions/adminCartAccess');

const isAdmin = await isAdminUser(session);
if (isAdmin) {
    const carts = await getAllCartsAdmin(session);
    console.log('Admin access working:', carts.success);
}
```

### Security Testing
```javascript
// Test with non-admin user
const regularUserSession = { /* regular user session */ };
const result = await getAllCartsAdmin(regularUserSession);
console.log('Access denied:', !result.success);
```

## Maintenance

### Regular Tasks
1. **Monitor admin access logs**
2. **Review user role changes**
3. **Check cart statistics**
4. **Validate security policies**

### Updates
- Keep admin functions up to date
- Monitor for security vulnerabilities
- Update documentation as needed

---

**Status:** ✅ **ACTIVE**  
**Last Updated:** January 2025  
**Maintainer:** Justin Linzan 