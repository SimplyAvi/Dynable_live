# 🧪 RBAC System Testing Plan

**Author:** Justin Linzan  
**Date:** June 2025  

---

## 🎯 **TESTING OVERVIEW**

This comprehensive testing plan will validate all RBAC features and ensure the system works correctly in all scenarios.

---

## 📋 **PRE-TESTING CHECKLIST**

### **Environment Setup:**
- [ ] Environment variables configured (see `ENVIRONMENT_SETUP.md`)
- [ ] Database migrations completed
- [ ] Backend server running without errors
- [ ] Frontend application accessible
- [ ] Supabase connection verified

### **Test Data Preparation:**
- [ ] Create test users for each role
- [ ] Prepare test products for sellers
- [ ] Set up anonymous cart data
- [ ] Configure test admin accounts

---

## 🔐 **AUTHENTICATION TESTING**

### **Test 1: Basic Login Flow**
```bash
# Test regular email/password login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Expected Results:**
- ✅ Returns JWT token with role information
- ✅ User data includes role field
- ✅ Backward compatibility with old tokens

### **Test 2: Google OAuth Flow**
1. Navigate to login page
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify callback processing

**Expected Results:**
- ✅ OAuth callback processes role data
- ✅ User redirected to appropriate dashboard
- ✅ Role information displayed correctly

### **Test 3: Anonymous User Conversion**
1. Browse as anonymous user
2. Add items to cart
3. Sign up/login
4. Verify cart merging

**Expected Results:**
- ✅ Anonymous cart preserved
- ✅ Cart merged with authenticated user
- ✅ User marked as converted from anonymous

---

## 👥 **ROLE-BASED ACCESS TESTING**

### **Test 4: Admin User Access**
```bash
# Test admin-only endpoints
curl -X GET http://localhost:5001/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

curl -X PUT http://localhost:5001/api/admin/users/1/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"seller","is_verified_seller":true}'
```

**Expected Results:**
- ✅ Admin can access admin endpoints
- ✅ Admin can change user roles
- ✅ Admin can verify sellers
- ✅ Unauthorized users blocked

### **Test 5: Seller User Access**
```bash
# Test seller endpoints
curl -X GET http://localhost:5001/api/seller/products \
  -H "Authorization: Bearer SELLER_TOKEN"

curl -X POST http://localhost:5001/api/seller/products \
  -H "Authorization: Bearer SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":10.99}'
```

**Expected Results:**
- ✅ Seller can access seller endpoints
- ✅ Seller can manage own products
- ✅ Seller can update store information
- ✅ Non-sellers blocked from seller endpoints

### **Test 6: End User Access**
```bash
# Test end user endpoints
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer USER_TOKEN"

curl -X POST http://localhost:5001/api/auth/apply-seller \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected Results:**
- ✅ End users can access user endpoints
- ✅ End users can apply for seller role
- ✅ End users cannot access admin/seller endpoints
- ✅ Role upgrade process works

---

## 🛡️ **SECURITY TESTING**

### **Test 7: RLS Policy Validation**
```bash
# Test database-level security
psql $SUPABASE_DB_URL -c "
SELECT 
  tablename, 
  policyname, 
  permissive 
FROM pg_policies 
WHERE tablename IN ('Users', 'IngredientCategorized', 'Carts');
"
```

**Expected Results:**
- ✅ RLS policies active on all tables
- ✅ Users can only access own data
- ✅ Sellers can only access own products
- ✅ Admins can access all data

### **Test 8: JWT Token Security**
```javascript
// Test JWT token validation
const jwt = require('jsonwebtoken');
const token = 'YOUR_JWT_TOKEN';

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token payload:', decoded);
  console.log('Role:', decoded.role);
} catch (error) {
  console.error('Token validation failed:', error);
}
```

**Expected Results:**
- ✅ Tokens contain role information
- ✅ Tokens are properly signed
- ✅ Invalid tokens rejected
- ✅ Expired tokens handled

### **Test 9: Route Protection**
1. Try accessing admin routes as non-admin
2. Try accessing seller routes as non-seller
3. Try accessing protected routes without token

**Expected Results:**
- ✅ Unauthorized access blocked
- ✅ Proper error messages displayed
- ✅ Redirects to appropriate pages
- ✅ Role-specific access enforced

---

## 🛒 **CART & USER EXPERIENCE TESTING**

### **Test 10: Anonymous Cart Functionality**
1. Browse products without logging in
2. Add items to cart
3. Verify cart persists in localStorage
4. Check cart data structure

**Expected Results:**
- ✅ Cart data stored in localStorage
- ✅ Cart persists across page refreshes
- ✅ Cart data properly formatted
- ✅ Anonymous user ID generated

### **Test 11: Cart Merging Process**
1. Add items as anonymous user
2. Sign up/login
3. Verify cart items merged
4. Check for duplicates

**Expected Results:**
- ✅ Anonymous cart merged with user cart
- ✅ No duplicate items
- ✅ Quantities properly combined
- ✅ Anonymous cart data cleaned up

### **Test 12: Role-Specific UI**
1. Login as different user types
2. Check profile page displays
3. Verify role badges
4. Test role-specific features

**Expected Results:**
- ✅ Role badges display correctly
- ✅ Role-specific sections shown
- ✅ Admin controls visible for admins
- ✅ Seller dashboard for sellers

---

## 🔄 **ROLE UPGRADE TESTING**

### **Test 13: End User to Seller Upgrade**
1. Login as end user
2. Navigate to profile
3. Click "Become a Seller"
4. Verify role change

**Expected Results:**
- ✅ Role changed to seller
- ✅ Seller features unlocked
- ✅ Store management available
- ✅ Product management enabled

### **Test 14: Seller Verification Process**
1. Login as admin
2. Navigate to seller management
3. Verify unverified seller
4. Check verification status

**Expected Results:**
- ✅ Admin can verify sellers
- ✅ Seller verification status updated
- ✅ Verified sellers get full access
- ✅ Unverified sellers have limited access

---

## 📊 **PERFORMANCE TESTING**

### **Test 15: Authentication Performance**
```bash
# Test login response time
time curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Expected Results:**
- ✅ Login response < 200ms
- ✅ Role checking < 50ms
- ✅ Route protection < 100ms
- ✅ Cart merging < 500ms

### **Test 16: Database Performance**
```bash
# Test database query performance
psql $SUPABASE_DB_URL -c "
EXPLAIN ANALYZE SELECT * FROM \"Users\" WHERE role = 'admin';
"
```

**Expected Results:**
- ✅ Queries use proper indexes
- ✅ RLS policies don't impact performance
- ✅ Role-based queries optimized
- ✅ No N+1 query problems

---

## 🐛 **ERROR HANDLING TESTING**

### **Test 17: Invalid Token Handling**
```bash
# Test with invalid token
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Expected Results:**
- ✅ Proper error response
- ✅ Clear error message
- ✅ No sensitive data exposed
- ✅ Graceful degradation

### **Test 18: Missing Role Data**
1. Create user without role
2. Login with legacy token
3. Verify backward compatibility
4. Check default role assignment

**Expected Results:**
- ✅ Legacy tokens work
- ✅ Default role assigned
- ✅ No errors thrown
- ✅ Smooth transition

---

## 📋 **TESTING CHECKLIST**

### **Authentication:**
- [ ] Regular login works
- [ ] Google OAuth works
- [ ] Role information included
- [ ] Backward compatibility
- [ ] Anonymous user conversion

### **Authorization:**
- [ ] Admin access works
- [ ] Seller access works
- [ ] End user access works
- [ ] Unauthorized access blocked
- [ ] Role-specific redirects

### **Security:**
- [ ] RLS policies active
- [ ] JWT tokens secure
- [ ] Route protection works
- [ ] Data access controlled
- [ ] Admin actions logged

### **User Experience:**
- [ ] Role badges display
- [ ] Cart merging works
- [ ] Role upgrades function
- [ ] UI responsive
- [ ] Error messages clear

### **Performance:**
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Scalable architecture

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

**Issue:** "JWT_SECRET must have a value"
**Solution:** Set JWT_SECRET in environment variables

**Issue:** "Cannot find module '@supabase/supabase-js'"
**Solution:** Run `npm install @supabase/supabase-js`

**Issue:** "RLS policy does not exist"
**Solution:** Run Phase 2 database migration

**Issue:** "Role not found"
**Solution:** Check user table has role column

---

## ✅ **SUCCESS CRITERIA**

The RBAC system is working correctly when:

1. **All user roles function properly**
2. **Route protection is effective**
3. **Authentication flow is seamless**
4. **Cart merging works for anonymous users**
5. **Role upgrades function properly**
6. **Admin controls are accessible**
7. **Seller management works**
8. **Backward compatibility is maintained**
9. **Security policies are enforced**
10. **Performance meets requirements**

---

**🎉 Once all tests pass, your RBAC system is ready for production!** 