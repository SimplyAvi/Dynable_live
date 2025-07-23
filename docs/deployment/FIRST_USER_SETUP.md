# 👑 First User Setup Guide

**Author:** Justin Linzan  
**Date:** June 2025  

---

## 🎯 **OVERVIEW**

This guide will help you set up the first admin user and test the complete RBAC system functionality.

---

## 📋 **PREREQUISITES**

Before setting up the first user, ensure:

- [ ] Environment variables configured (see `ENVIRONMENT_SETUP.md`)
- [ ] Database migrations completed
- [ ] Backend server running
- [ ] Frontend application accessible

---

## 🔧 **STEP 1: CREATE FIRST ADMIN USER**

### **Option A: Direct Database Insert**
```sql
-- Connect to your Supabase database
psql $SUPABASE_DB_URL

-- Insert first admin user
INSERT INTO "Users" (
    email, 
    name, 
    role, 
    "createdAt", 
    "updatedAt"
) VALUES (
    'admin@dynable.com',
    'System Administrator',
    'admin',
    NOW(),
    NOW()
);

-- Verify the user was created
SELECT id, email, name, role FROM "Users" WHERE role = 'admin';
```

### **Option B: Using Signup API**
```bash
# Create admin user via API
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dynable.com",
    "password": "secure_password_123",
    "name": "System Administrator"
  }'

# Then update role to admin in database
psql $SUPABASE_DB_URL -c "
UPDATE \"Users\" 
SET role = 'admin' 
WHERE email = 'admin@dynable.com';
"
```

---

## 🧪 **STEP 2: TEST ADMIN FUNCTIONALITY**

### **Test Admin Login**
```bash
# Test admin login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dynable.com",
    "password": "secure_password_123"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@dynable.com",
    "name": "System Administrator",
    "role": "admin",
    "is_verified_seller": false,
    "converted_from_anonymous": false
  },
  "token": "eyJ...",
  "supabaseToken": "eyJ..."
}
```

### **Test Admin Endpoints**
```bash
# Get admin token from login response
ADMIN_TOKEN="your_admin_jwt_token"

# Test admin user management
curl -X GET http://localhost:5001/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Test seller management
curl -X GET http://localhost:5001/api/admin/sellers \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 👥 **STEP 3: CREATE TEST USERS**

### **Create Seller User**
```sql
-- Insert test seller
INSERT INTO "Users" (
    email, 
    name, 
    role, 
    store_name,
    store_description,
    is_verified_seller,
    "createdAt", 
    "updatedAt"
) VALUES (
    'seller@dynable.com',
    'Test Seller',
    'seller',
    'Test Store',
    'A test store for RBAC testing',
    true,
    NOW(),
    NOW()
);
```

### **Create End User**
```sql
-- Insert test end user
INSERT INTO "Users" (
    email, 
    name, 
    role, 
    "createdAt", 
    "updatedAt"
) VALUES (
    'user@dynable.com',
    'Test User',
    'end_user',
    NOW(),
    NOW()
);
```

---

## 🧪 **STEP 4: COMPREHENSIVE TESTING**

### **Test 1: Admin User Journey**
1. **Login as admin**
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@dynable.com","password":"secure_password_123"}'
   ```

2. **Access admin dashboard**
   - Navigate to `/admin/dashboard`
   - Verify admin controls visible
   - Check user management features

3. **Manage users**
   ```bash
   # List all users
   curl -X GET http://localhost:5001/api/admin/users \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   
   # Change user role
   curl -X PUT http://localhost:5001/api/admin/users/2/role \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"role":"seller","is_verified_seller":true}'
   ```

### **Test 2: Seller User Journey**
1. **Login as seller**
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"seller@dynable.com","password":"password"}'
   ```

2. **Access seller dashboard**
   - Navigate to `/seller/dashboard`
   - Verify seller features visible
   - Check store management

3. **Manage products**
   ```bash
   # List seller products
   curl -X GET http://localhost:5001/api/seller/products \
     -H "Authorization: Bearer $SELLER_TOKEN"
   
   # Add new product
   curl -X POST http://localhost:5001/api/seller/products \
     -H "Authorization: Bearer $SELLER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Product","price":10.99,"stock_quantity":100}'
   ```

### **Test 3: End User Journey**
1. **Login as end user**
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@dynable.com","password":"password"}'
   ```

2. **Access user features**
   - Navigate to `/profile`
   - Verify "Become a Seller" option
   - Check user-specific features

3. **Apply for seller role**
   ```bash
   curl -X POST http://localhost:5001/api/auth/apply-seller \
     -H "Authorization: Bearer $USER_TOKEN"
   ```

---

## 🔄 **STEP 5: ROLE UPGRADE TESTING**

### **Test End User to Seller Upgrade**
1. **Login as end user**
2. **Navigate to profile page**
3. **Click "Become a Seller"**
4. **Verify role change**

```bash
# Check role before upgrade
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer $USER_TOKEN"

# Apply for seller role
curl -X POST http://localhost:5001/api/auth/apply-seller \
  -H "Authorization: Bearer $USER_TOKEN"

# Check role after upgrade
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer $USER_TOKEN"
```

### **Test Seller Verification**
1. **Login as admin**
2. **Navigate to seller management**
3. **Verify unverified seller**
4. **Check verification status**

```bash
# List unverified sellers
curl -X GET http://localhost:5001/api/admin/sellers \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Verify seller
curl -X PUT http://localhost:5001/api/admin/sellers/2/verify \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_verified_seller":true}'
```

---

## 🛡️ **STEP 6: SECURITY TESTING**

### **Test Unauthorized Access**
```bash
# Try accessing admin endpoints as non-admin
curl -X GET http://localhost:5001/api/admin/users \
  -H "Authorization: Bearer $USER_TOKEN"

# Try accessing seller endpoints as non-seller
curl -X GET http://localhost:5001/api/seller/products \
  -H "Authorization: Bearer $USER_TOKEN"

# Try accessing protected routes without token
curl -X GET http://localhost:5001/api/auth/profile
```

**Expected Results:**
- ✅ 403 Forbidden for unauthorized access
- ✅ Clear error messages
- ✅ Proper redirects

### **Test RLS Policies**
```sql
-- Test database-level security
-- Connect as different users and verify data access

-- Check user can only see own data
SELECT * FROM "Users" WHERE id = 1;

-- Check seller can only see own products
SELECT * FROM "IngredientCategorized" WHERE seller_id = 2;

-- Check admin can see all data
SELECT * FROM "Users";
SELECT * FROM "IngredientCategorized";
```

---

## 📊 **STEP 7: PERFORMANCE VERIFICATION**

### **Test Response Times**
```bash
# Test login performance
time curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dynable.com","password":"secure_password_123"}'

# Test role checking performance
time curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Results:**
- ✅ Login response < 200ms
- ✅ Role checking < 50ms
- ✅ Route protection < 100ms

---

## ✅ **STEP 8: SUCCESS VERIFICATION**

### **Checklist for Complete Setup:**

**Admin Functionality:**
- [ ] Admin can login successfully
- [ ] Admin dashboard accessible
- [ ] User management works
- [ ] Seller verification works
- [ ] System analytics accessible

**Seller Functionality:**
- [ ] Seller can login successfully
- [ ] Seller dashboard accessible
- [ ] Product management works
- [ ] Store management works
- [ ] Inventory control works

**End User Functionality:**
- [ ] End user can login successfully
- [ ] Profile page displays correctly
- [ ] "Become a Seller" option available
- [ ] Role upgrade process works
- [ ] User-specific features accessible

**Security Verification:**
- [ ] Unauthorized access blocked
- [ ] RLS policies active
- [ ] JWT tokens secure
- [ ] Role-based redirects work
- [ ] Error handling proper

**Performance Verification:**
- [ ] Response times acceptable
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] Scalable architecture

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

**Issue:** "Admin user not found"
**Solution:** Verify user was created in database with correct role

**Issue:** "Unauthorized access"
**Solution:** Check JWT token and role claims

**Issue:** "RLS policy error"
**Solution:** Run Phase 2 database migration

**Issue:** "Role not updating"
**Solution:** Check database constraints and triggers

---

## 🎉 **COMPLETION**

Once all tests pass:

1. **Your RBAC system is fully functional**
2. **All user roles work correctly**
3. **Security measures are in place**
4. **Performance meets requirements**
5. **System is ready for production**

**Congratulations! Your Dynable RBAC system is now complete and ready for deployment! 🚀** 