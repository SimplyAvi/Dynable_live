# 🔄 RBAC Migration Guide for Existing Google OAuth Setup

**Author:** Justin Linzan  
**Date:** June 2025  

---

## 🎯 **MIGRATION STRATEGY**

Since you already have Google OAuth working, we'll use a **backward-compatible migration approach** that preserves your existing setup while adding RBAC functionality.

---

## ✅ **RECOMMENDED APPROACH: Keep Your Existing JWT_SECRET**

### **Why This Approach:**
- ✅ **No User Disruption**: Existing users continue to work
- ✅ **Backward Compatibility**: Old tokens remain valid
- ✅ **Smooth Migration**: No forced re-authentication
- ✅ **Data Integrity**: Existing user data preserved

---

## 📋 **STEP-BY-STEP MIGRATION**

### **Step 1: Preserve Your Existing Configuration**

**Keep these existing variables:**
```bash
# Your existing .env file - KEEP THESE
JWT_SECRET=my_existing_secret_from_google_oauth_setup
REACT_APP_GOOGLE_CLIENT_ID=my_google_client_id
SUPABASE_DB_URL=my_existing_supabase_connection
```

### **Step 2: Add New RBAC Variables**

**Add these new variables to your existing .env:**
```bash
# Add these new variables
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_IDENTITY_LINKING_ENABLED=true
```

### **Step 3: Get Supabase Keys**

1. **Go to your Supabase dashboard**
2. **Navigate to Settings → API**
3. **Copy these values:**
   - Project URL → `SUPABASE_URL`
   - anon public key → `SUPABASE_ANON_KEY`
   - service_role secret key → `SUPABASE_SERVICE_ROLE_KEY`
4. **Navigate to Settings → JWT Settings**
5. **Copy JWT Secret → `SUPABASE_JWT_SECRET`**

### **Step 4: Update Your .env File**

**Your complete .env should look like this:**
```bash
# =============================================================================
# EXISTING CONFIGURATION (KEEP THESE)
# =============================================================================
JWT_SECRET=my_existing_secret_from_google_oauth_setup
REACT_APP_GOOGLE_CLIENT_ID=my_google_client_id
SUPABASE_DB_URL=my_existing_supabase_connection

# =============================================================================
# NEW RBAC VARIABLES (ADD THESE)
# =============================================================================
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_IDENTITY_LINKING_ENABLED=true
```

---

## 🔄 **HOW EXISTING USERS ARE HANDLED**

### **Existing User Migration:**
- **Existing tokens**: Continue to work (backward compatibility)
- **Role assignment**: Existing users get `end_user` role by default
- **Google OAuth**: Continues to work with enhanced role information
- **No disruption**: Users don't need to re-authenticate

### **Token Format Evolution:**

**Old Token Format (Still Valid):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name"
}
```

**New Token Format (Enhanced):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "role": "end_user",
  "is_verified_seller": false,
  "converted_from_anonymous": false
}
```

---

## 🗄️ **DATABASE MIGRATION**

### **Step 1: Run Phase 1 Migration**
```bash
# This adds role column to existing users
psql $SUPABASE_DB_URL -f phase1_database_migration.sql
```

**What happens to existing users:**
- Role column is added to Users table
- Existing users get `end_user` role by default
- No data loss or disruption

### **Step 2: Run Phase 2 Migration**
```bash
# This adds RLS policies
psql $SUPABASE_DB_URL -f phase2_supabase_rls_policies.sql
```

### **Step 3: Verify Migration**
```bash
# Check that migrations worked
psql $SUPABASE_DB_URL -f verify_migrations.sql
```

---

## 🧪 **TESTING MIGRATION**

### **Step 1: Test Existing Authentication**
```bash
# Test that existing users can still login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"existing_user@example.com","password":"password"}'
```

**Expected Result:**
- ✅ Login works
- ✅ Token contains role information
- ✅ Backward compatibility maintained

### **Step 2: Test Google OAuth**
1. **Login with Google OAuth**
2. **Verify role information is included**
3. **Check that existing functionality works**

### **Step 3: Test New RBAC Features**
```bash
# Test role-based endpoints
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 👑 **CREATE FIRST ADMIN USER**

### **Option A: Database Insert**
```sql
-- Create first admin user
INSERT INTO "Users" (email, name, role, "createdAt", "updatedAt")
VALUES ('admin@dynable.com', 'System Administrator', 'admin', NOW(), NOW());
```

### **Option B: API Signup + Role Update**
```bash
# 1. Create user via API
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dynable.com","password":"secure_password","name":"Admin User"}'

# 2. Update role to admin in database
psql $SUPABASE_DB_URL -c "
UPDATE \"Users\" 
SET role = 'admin' 
WHERE email = 'admin@dynable.com';
"
```

---

## 🔍 **VERIFICATION CHECKLIST**

### **Backward Compatibility:**
- [ ] Existing users can login
- [ ] Existing tokens work
- [ ] Google OAuth continues to work
- [ ] No user disruption

### **New RBAC Features:**
- [ ] Role information in tokens
- [ ] Role-based route protection
- [ ] Admin user management
- [ ] Seller features work
- [ ] Anonymous user support

### **Database Migration:**
- [ ] Role column added to Users table
- [ ] Existing users have end_user role
- [ ] RLS policies active
- [ ] Admin user created

---

## 🚨 **TROUBLESHOOTING**

### **Issue: "Existing users can't login"**
**Solution:**
1. Check that JWT_SECRET is preserved
2. Verify database migration completed
3. Check server logs for errors

### **Issue: "Role information missing"**
**Solution:**
1. Ensure new environment variables are set
2. Check that migrations ran successfully
3. Verify user has role assigned

### **Issue: "Google OAuth not working"**
**Solution:**
1. Verify REACT_APP_GOOGLE_CLIENT_ID is preserved
2. Check that OAuth callback handles roles
3. Test with existing Google account

---

## 🎉 **MIGRATION COMPLETE**

Once all steps are completed:

1. **✅ Existing users continue to work**
2. **✅ New RBAC features are available**
3. **✅ Backward compatibility maintained**
4. **✅ Google OAuth enhanced with roles**
5. **✅ Admin and seller features functional**

---

**🚀 Your RBAC system is ready for production with full backward compatibility!** 