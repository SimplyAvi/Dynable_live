# 🔐 Dynable RBAC Implementation Guide

**Author:** Justin Linzan  
**Date:** July 2025  
**Version:** 2.0 (Consolidated)

---

## 📋 **Table of Contents**

1. [Overview](#-overview)
2. [Architecture](#-architecture)
3. [Implementation Phases](#-implementation-phases)
4. [Testing Strategy](#-testing-strategy)
5. [Maintenance](#-maintenance)

---

## 🎯 **Overview**

The Dynable Role-Based Access Control (RBAC) system provides secure, role-based authentication and authorization for the platform. This system supports multiple user types with different permission levels.

### **User Roles**

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | System administrator | Full system access, user management, system oversight |
| **Seller** | Product sellers | Product management, inventory, sales analytics |
| **End User** | Regular customers | Browse products, place orders, manage profile |
| **Anonymous** | Unauthenticated users | Browse products, add to cart (localStorage) |

### **Key Features**

- **Role-based authentication** with JWT tokens
- **Supabase RLS policies** for database-level security
- **Anonymous user support** with cart persistence
- **Identity linking** for anonymous → authenticated conversion
- **Seller verification system** with admin oversight
- **Admin user management** with role assignment

---

## 🏗️ **Architecture**

### **System Components**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ • React App     │◄──►│ • Express API   │◄──►│ • PostgreSQL    │
│ • Redux Store   │    │ • JWT Auth      │    │ • Supabase RLS  │
│ • Route Guards  │    │ • Role Middleware│    │ • User Roles    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Authentication Flow**

1. **User Login** → Google OAuth or email/password
2. **JWT Generation** → Standard + Supabase tokens with role claims
3. **Token Storage** → Redux store + localStorage
4. **API Requests** → Role-based middleware validation
5. **Database Access** → RLS policies enforce permissions

### **Anonymous User Flow**

1. **Browse Products** → No authentication required
2. **Add to Cart** → localStorage cart management
3. **Sign Up/Login** → Identity linking process
4. **Cart Transfer** → Anonymous cart → Database cart
5. **Full Access** → Regular authenticated user

---

## 🚀 **Implementation Phases**

### **Phase 1: Database Schema**

**Files:** `database/migrations/phase1_database_migration.sql`

**Changes:**
- Add `role` ENUM field to Users table
- Add seller fields (`store_name`, `store_description`, `is_verified_seller`)
- Add anonymous user fields (`converted_from_anonymous`, `anonymous_cart_data`)
- Add product ownership fields (`seller_id`, `stock_quantity`, `is_active`)
- Create `admin_actions` table for audit trail

**Run:**
```bash
psql $SUPABASE_DB_URL -f database/migrations/phase1_database_migration.sql
```

### **Phase 2: Supabase RLS Policies**

**Files:** `database/migrations/phase2_supabase_rls_policies.sql`

**Changes:**
- Enable RLS on all tables
- Create role-based access policies
- Set up anonymous user policies
- Configure product ownership rules
- Implement admin-only policies

**Run:**
```bash
psql $SUPABASE_DB_URL -f database/migrations/phase2_supabase_rls_policies.sql
```

### **Phase 3: Backend Integration**

**Files:** 
- `server/utils/jwt.js` - JWT utilities
- `server/middleware/roleAuth.js` - Role middleware
- `server/api/authRoutes.js` - Updated auth routes
- `server/api/sellerRoutes.js` - Seller endpoints

**Changes:**
- Implement role-based JWT generation
- Add role middleware for route protection
- Update authentication routes with role handling
- Add seller-specific API endpoints
- Implement identity linking for anonymous users

### **Phase 4: Frontend Integration**

**Files:**
- `src/redux/authSlice.js` - Updated Redux store
- `src/components/Auth/ProtectedRoute.js` - Role-based routing
- `src/components/Auth/Profile.js` - Role-specific UI
- `src/components/Auth/Login.js` - Role handling

**Changes:**
- Add role fields to Redux state
- Implement role-based route protection
- Add role-specific UI components
- Handle anonymous user conversion
- Update login flow with role data

---

## 🧪 **Testing Strategy**

### **Environment Testing**

```bash
# Test environment configuration
node scripts/rbac/test_env_setup.js

# Verify RBAC setup
node scripts/rbac/verify_rbac_setup.js
```

### **Database Testing**

```bash
# Test migrations
psql $SUPABASE_DB_URL -f database/migrations/verify_migrations.sql

# Test user roles
psql $SUPABASE_DB_URL -c "SELECT role, COUNT(*) FROM \"Users\" GROUP BY role;"
```

### **API Testing**

```bash
# Test authentication
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test role-based endpoints
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Frontend Testing**

**Manual Tests:**
- [ ] Login with different user types
- [ ] Verify role-specific UI displays
- [ ] Test route protection
- [ ] Check anonymous user flow
- [ ] Verify cart transfer on signup

**Automated Tests:**
```bash
# Run frontend tests
npm test

# Run E2E tests
npm run cypress:run
```

### **Role-Specific Testing**

#### **Admin User Tests**
- [ ] Can access admin dashboard
- [ ] Can view all users
- [ ] Can change user roles
- [ ] Can verify sellers
- [ ] Can access system analytics

#### **Seller User Tests**
- [ ] Can access seller dashboard
- [ ] Can manage their products
- [ ] Can update inventory
- [ ] Can view sales analytics
- [ ] Cannot access admin functions

#### **End User Tests**
- [ ] Can browse products
- [ ] Can add items to cart
- [ ] Can place orders
- [ ] Can manage profile
- [ ] Cannot access seller/admin functions

#### **Anonymous User Tests**
- [ ] Can browse products
- [ ] Can add to cart (localStorage)
- [ ] Cannot checkout
- [ ] Cart transfers on signup
- [ ] Cannot access protected features

---

## 🔧 **Maintenance**

### **Adding New Roles**

1. **Update Database Schema:**
```sql
-- Add new role to ENUM
ALTER TYPE user_role ADD VALUE 'new_role';
```

2. **Update JWT Utilities:**
```javascript
// Add role to validation
const validRoles = ['admin', 'seller', 'end_user', 'new_role'];
```

3. **Update Middleware:**
```javascript
// Add role-specific middleware
const requireNewRole = requireRole(['new_role']);
```

4. **Update Frontend:**
```javascript
// Add role to Redux selectors
export const selectIsNewRole = (state) => state.auth.role === 'new_role';
```

### **Adding New Permissions**

1. **Update RLS Policies:**
```sql
-- Add new policy
CREATE POLICY "new_permission" ON "TableName"
FOR ACTION USING (role_check_function());
```

2. **Update Middleware:**
```javascript
// Add permission check
const requireNewPermission = requirePermission('new_action');
```

3. **Update Frontend:**
```javascript
// Add permission selector
export const selectCanPerformNewAction = (state) => 
  hasPermission(state.auth.user, 'new_action');
```

### **Monitoring and Logging**

#### **Admin Actions Logging**
```javascript
// Log admin actions
await AdminAction.create({
  admin_id: req.user.id,
  action_type: 'user_role_change',
  target_user_id: userId,
  details: { old_role, new_role }
});
```

#### **Error Monitoring**
```javascript
// Monitor authentication errors
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.error('Auth error:', err.message);
  }
  next(err);
});
```

### **Performance Optimization**

#### **JWT Token Optimization**
```javascript
// Use shorter tokens for better performance
const token = jwt.sign(payload, secret, { expiresIn: '1h' });
```

#### **Database Query Optimization**
```sql
-- Add indexes for role-based queries
CREATE INDEX idx_users_role_active ON "Users"(role, "isActive");
```

---

## 📊 **Monitoring Checklist**

### **Daily Checks**
- [ ] Authentication errors in logs
- [ ] Failed login attempts
- [ ] Role assignment issues
- [ ] Anonymous user conversion rate

### **Weekly Checks**
- [ ] Admin action audit log
- [ ] Seller verification requests
- [ ] User role distribution
- [ ] Performance metrics

### **Monthly Checks**
- [ ] Security policy review
- [ ] Permission audit
- [ ] User feedback analysis
- [ ] System performance review

---

## 🎯 **Best Practices**

### **Security**
- Always validate JWT tokens on every request
- Use HTTPS in production
- Implement rate limiting on auth endpoints
- Log all admin actions for audit trail
- Regularly rotate JWT secrets

### **Performance**
- Cache user roles in Redux store
- Use database indexes for role queries
- Implement token refresh mechanism
- Optimize RLS policies for read performance

### **User Experience**
- Provide clear error messages for unauthorized access
- Implement smooth anonymous → authenticated conversion
- Show appropriate UI based on user role
- Maintain cart data during authentication flow

---

## 📞 **Support**

For implementation issues:
1. Check the troubleshooting section in `DEPLOYMENT_GUIDE.md`
2. Review server logs for error messages
3. Verify database migrations completed successfully
4. Test environment variables are correctly set

**The RBAC system is production-ready and fully documented!** 🔐 