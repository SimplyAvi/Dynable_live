# Admin System

**Author:** Justin Linzan  
**Date:** January 2025  
**Status:** ✅ ACTIVE

## Overview

The admin system provides comprehensive administrative functions for managing carts, users, and system administration. All functions include proper security validation and error handling.

## Directory Structure

```
server/admin/
├── functions/
│   ├── index.js                    # Central export file
│   ├── adminCartAccess.js          # Cart management functions
│   └── adminUserManagement.js      # User management functions
├── docs/
│   ├── README.md                   # Documentation index
│   ├── ADMIN_FUNCTIONS_GUIDE.md   # Complete functions guide
│   └── RLS_AND_CART_FIXES_SUMMARY.md  # Security fixes documentation
└── migrations/
    ├── fix_rls_and_cart_issues.sql
    ├── fix_remaining_string_prices.sql
    ├── simple_price_fix.sql
    └── final_price_fix.sql
```

## Quick Start

### Import Admin Functions
```javascript
// Import all admin functions
const adminFunctions = require('./admin/functions');

// Import specific modules
const { cartAccess, userManagement } = require('./admin/functions');

// Import individual functions
const { isAdminUser, getAllCartsAdmin } = require('./admin/functions');
```

### Basic Usage
```javascript
const { isAdminUser, getAllCartsAdmin } = require('./admin/functions');

// Check admin status
const isAdmin = await isAdminUser(session);
if (isAdmin) {
    // Get all carts
    const result = await getAllCartsAdmin(session);
    console.log(`Found ${result.count} carts`);
}
```

## Functions Overview

### Cart Management
| Function | Purpose | Admin Only |
|----------|---------|------------|
| `isAdminUser()` | Check admin privileges | No |
| `getAllCartsAdmin()` | Get all carts | Yes |
| `getCartByUserIdAdmin()` | Get cart for specific user | Yes |
| `updateCartItemsAdmin()` | Update cart items | Yes |
| `deleteCartAdmin()` | Delete cart | Yes |
| `getCartStatisticsAdmin()` | Get cart statistics | Yes |

### User Management
| Function | Purpose | Admin Only |
|----------|---------|------------|
| `getAllUsersAdmin()` | Get all users | Yes |
| `updateUserRoleAdmin()` | Update user role | Yes |
| `getUserStatisticsAdmin()` | Get user statistics | Yes |
| `deleteUserAdmin()` | Delete user | Yes |

## Security Features

### ✅ Admin Privilege Verification
- JWT role checking
- Users table fallback
- Email-based verification

### ✅ Error Handling
- Comprehensive error messages
- Graceful degradation
- Detailed logging

### ✅ Data Validation
- Input sanitization
- Type checking
- Format validation

## Recent Fixes

### ✅ RLS Policy Fixes
- **Admin Access** - Fixed admin user blocking
- **Multiple Auth Methods** - JWT + Users table fallback
- **Security Maintained** - Proper access controls

### ✅ Cart Data Fixes
- **Price Data Types** - All prices now numeric
- **Frontend Safety** - Safe price formatting
- **Error Prevention** - No more crashes

## Documentation

### 📚 Complete Guides
- **[ADMIN_FUNCTIONS_GUIDE.md](docs/ADMIN_FUNCTIONS_GUIDE.md)** - Complete functions guide
- **[RLS_AND_CART_FIXES_SUMMARY.md](docs/RLS_AND_CART_FIXES_SUMMARY.md)** - Security fixes documentation

### 🔧 Migration Files
- `fix_rls_and_cart_issues.sql` - Comprehensive RLS and cart fixes
- `fix_remaining_string_prices.sql` - Price data type fixes
- `simple_price_fix.sql` - Simple price conversion
- `final_price_fix.sql` - Final comprehensive price fix

## Testing

### Admin Access Test
```javascript
const { isAdminUser, getAllCartsAdmin } = require('./admin/functions');

// Test admin access
const isAdmin = await isAdminUser(session);
if (isAdmin) {
    const result = await getAllCartsAdmin(session);
    console.log('Admin access working:', result.success);
}
```

### Security Test
```javascript
// Test with non-admin user
const regularUserSession = { /* regular user session */ };
const result = await getAllCartsAdmin(regularUserSession);
console.log('Access denied:', !result.success);
```

## Integration Examples

### Express Route
```javascript
const express = require('express');
const router = express.Router();
const { getAllCartsAdmin } = require('./admin/functions');

router.get('/admin/carts', async (req, res) => {
    const session = req.session;
    const result = await getAllCartsAdmin(session);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(403).json(result);
    }
});
```

### API Endpoint
```javascript
const { updateUserRoleAdmin } = require('./admin/functions');

app.put('/admin/users/:userId/role', async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    const session = req.session;
    
    const result = await updateUserRoleAdmin(session, userId, role);
    res.json(result);
});
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

## Performance

### Database Queries
- Optimized queries with proper joins
- Results ordered by most recent first
- Pagination support for large datasets

### Caching
- Consider caching admin statistics
- Cache user role verification results
- Implement cache invalidation on role changes

## Monitoring

### Admin Action Logging
```javascript
console.log('[ADMIN] User role updated:', { userId, newRole });
console.log('[ADMIN] Cart accessed:', { cartId, adminId });
```

### Error Monitoring
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