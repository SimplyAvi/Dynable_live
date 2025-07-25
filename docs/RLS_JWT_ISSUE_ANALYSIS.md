# 🚨 **RLS JWT AUTHENTICATION ISSUE ANALYSIS**

**Date:** July 2025  
**Issue:** SimplyAvi experiencing RLS policy problems  
**Author:** Justin Linzan

---

## 🎯 **PROBLEM IDENTIFICATION**

### **🚨 Core Issue:**
SimplyAvi is experiencing problems because **RLS policies aren't recognizing JWT-based admin roles**. This is a classic **authentication/authorization mismatch** in Supabase.

### **🔍 Specific Symptoms:**
1. **Only seeing 10 allergies** (RLS limiting results)
2. **Allergy toggles getting stuck** (RLS blocking updates)
3. **Admin role from JWT not being used** by RLS policies
4. **Data access being blocked** despite admin privileges

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **A. RLS Policy Configuration**

Looking at the current RLS policies in `database/migrations/phase2_supabase_rls_policies.sql`:

```sql
-- Current policy for allergies (AllergenDerivatives table)
-- ❌ PROBLEM: No RLS policy exists for AllergenDerivatives table!

-- Current policies only cover:
-- ✅ Users table
-- ✅ Carts table  
-- ✅ Orders table
-- ✅ IngredientCategorized table
-- ✅ admin_actions table
-- ❌ AllergenDerivatives table (MISSING)
-- ❌ Substitutions table (MISSING)
```

### **B. JWT Token Structure**

The JWT tokens are being generated correctly in `server/utils/jwt.js`:

```javascript
// ✅ CORRECT: JWT includes role information
const generateSupabaseToken = (user) => {
  const payload = {
    sub: user.id.toString(),
    email: user.email,
    role: user.role || 'end_user',  // ✅ Role included
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
    iat: Math.floor(Date.now() / 1000),
    is_verified_seller: user.is_verified_seller || false,
    converted_from_anonymous: user.converted_from_anonymous || false,
    is_anonymous: false,
  };
  return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);
};
```

### **C. Missing RLS Policies**

**The problem:** Several tables that SimplyAvi needs to access don't have RLS policies:

1. **AllergenDerivatives table** - No RLS policy exists
2. **Substitutions table** - No RLS policy exists  
3. **Recipes table** - No RLS policy exists
4. **RecipeIngredients table** - No RLS policy exists

---

## 🛠️ **SOLUTION: FIX RLS POLICIES**

### **Step 1: Add Missing RLS Policies**

Create a new migration file to add RLS policies for missing tables:

```sql
-- Add RLS policies for missing tables
-- File: database/migrations/fix_rls_policies.sql

-- 1. Enable RLS on missing tables
ALTER TABLE "AllergenDerivatives" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Substitutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeIngredients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ingredients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IngredientToCanonical" ENABLE ROW LEVEL SECURITY;

-- 2. AllergenDerivatives policies (public read, admin write)
CREATE POLICY "allergens_public_read" ON "AllergenDerivatives"
    FOR SELECT USING (true);  -- Everyone can read allergens

CREATE POLICY "allergens_admin_write" ON "AllergenDerivatives"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 3. Substitutions policies (public read, admin write)
CREATE POLICY "substitutions_public_read" ON "Substitutions"
    FOR SELECT USING (true);  -- Everyone can read substitutions

CREATE POLICY "substitutions_admin_write" ON "Substitutions"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 4. Recipes policies (public read, admin write)
CREATE POLICY "recipes_public_read" ON "Recipes"
    FOR SELECT USING (true);  -- Everyone can read recipes

CREATE POLICY "recipes_admin_write" ON "Recipes"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 5. RecipeIngredients policies (public read, admin write)
CREATE POLICY "recipe_ingredients_public_read" ON "RecipeIngredients"
    FOR SELECT USING (true);  -- Everyone can read recipe ingredients

CREATE POLICY "recipe_ingredients_admin_write" ON "RecipeIngredients"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 6. Ingredients policies (public read, admin write)
CREATE POLICY "ingredients_public_read" ON "Ingredients"
    FOR SELECT USING (true);  -- Everyone can read ingredients

CREATE POLICY "ingredients_admin_write" ON "Ingredients"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 7. IngredientToCanonical policies (public read, admin write)
CREATE POLICY "ingredient_mappings_public_read" ON "IngredientToCanonical"
    FOR SELECT USING (true);  -- Everyone can read mappings

CREATE POLICY "ingredient_mappings_admin_write" ON "IngredientToCanonical"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );
```

### **Step 2: Update Existing Policies**

Fix the existing policies to properly handle admin roles:

```sql
-- Update existing policies to be more permissive for admins
-- File: database/migrations/update_existing_rls_policies.sql

-- 1. Update Users policies to allow admin access
DROP POLICY IF EXISTS "admin_users_all" ON "Users";
CREATE POLICY "admin_users_all" ON "Users"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin' OR
        auth.uid()::text = id::text
    );

-- 2. Update IngredientCategorized policies
DROP POLICY IF EXISTS "products_public_read" ON "IngredientCategorized";
CREATE POLICY "products_public_read" ON "IngredientCategorized"
    FOR SELECT USING (
        is_active = true OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 3. Update Carts policies
DROP POLICY IF EXISTS "users_own_cart" ON "Carts";
CREATE POLICY "users_own_cart" ON "Carts"
    FOR ALL USING (
        "userId"::text = auth.uid()::text OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );
```

### **Step 3: Test JWT Token Recognition**

Create a test script to verify JWT tokens are being recognized:

```javascript
// File: server/scripts/rbac/test_jwt_rls.js
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const testJWTRLS = async () => {
  try {
    // Create test admin user token
    const adminToken = jwt.sign({
      sub: '1',
      email: 'admin@test.com',
      role: 'admin',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
      iat: Math.floor(Date.now() / 1000),
      is_anonymous: false
    }, process.env.SUPABASE_JWT_SECRET);

    // Test Supabase client with admin token
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      }
    );

    // Test admin access to allergens
    const { data: allergens, error } = await supabase
      .from('AllergenDerivatives')
      .select('*')
      .limit(10);

    console.log('Admin allergens access:', { data: allergens, error });
    
    // Test admin access to users
    const { data: users, error: userError } = await supabase
      .from('Users')
      .select('*')
      .limit(5);

    console.log('Admin users access:', { data: users, error: userError });

  } catch (error) {
    console.error('JWT RLS test failed:', error);
  }
};

testJWTRLS();
```

---

## 🧪 **TESTING STRATEGY**

### **Test 1: Verify RLS Policies Exist**
```bash
# Check which tables have RLS enabled
psql $SUPABASE_DB_URL -c "
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('Users', 'Carts', 'Orders', 'IngredientCategorized', 'admin_actions', 'AllergenDerivatives', 'Substitutions', 'Recipes', 'RecipeIngredients', 'Ingredients', 'IngredientToCanonical')
ORDER BY tablename;
"
```

### **Test 2: Verify JWT Token Structure**
```bash
# Test JWT token generation
node server/scripts/rbac/test_jwt_rls.js
```

### **Test 3: Test Admin Access**
```bash
# Test admin access to allergens
curl -X GET http://localhost:5001/api/allergens/allergens \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### **Test 4: Test Frontend Integration**
```bash
# Start the application and test SimplyAvi's access
npm start
# Then test in browser with SimplyAvi's account
```

---

## 🎯 **EXPECTED RESULTS AFTER FIX**

### **✅ SimplyAvi Should Be Able To:**
1. **See all allergens** (not just 10)
2. **Toggle allergies** without getting stuck
3. **Access admin functions** properly
4. **View all data** without RLS restrictions
5. **Manage users** and system settings

### **✅ System Should Work:**
1. **JWT tokens recognized** by RLS policies
2. **Admin role properly identified** in database queries
3. **All tables accessible** to admin users
4. **Frontend allergy filtering** working correctly
5. **No more "stuck" toggles** or limited data

---

## 🚀 **IMPLEMENTATION STEPS**

### **Step 1: Run RLS Fix Migration**
```bash
# Create and run the RLS fix migration
psql $SUPABASE_DB_URL -f database/migrations/fix_rls_policies.sql
```

### **Step 2: Update Existing Policies**
```bash
# Update existing policies
psql $SUPABASE_DB_URL -f database/migrations/update_existing_rls_policies.sql
```

### **Step 3: Test JWT Recognition**
```bash
# Test JWT token recognition
node server/scripts/rbac/test_jwt_rls.js
```

### **Step 4: Verify SimplyAvi's Access**
```bash
# Test SimplyAvi's account access
# Login as SimplyAvi and verify:
# - Can see all allergens
# - Can toggle allergies
# - Can access admin functions
```

---

## 🔍 **DEBUGGING COMMANDS**

### **Check Current RLS Status:**
```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('Users', 'Carts', 'Orders', 'IngredientCategorized', 'admin_actions', 'AllergenDerivatives', 'Substitutions')
ORDER BY tablename;

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('Users', 'Carts', 'Orders', 'IngredientCategorized', 'admin_actions', 'AllergenDerivatives', 'Substitutions')
ORDER BY tablename, policyname;
```

### **Test JWT Token:**
```javascript
// Decode and verify JWT token
const jwt = require('jsonwebtoken');
const token = 'SIMPLYAVI_JWT_TOKEN';
const decoded = jwt.decode(token);
console.log('JWT payload:', decoded);
```

---

## 📋 **SUMMARY**

### **🎯 Root Cause:**
SimplyAvi's JWT admin role isn't being recognized by RLS policies because:
1. **Missing RLS policies** on key tables (AllergenDerivatives, Substitutions, etc.)
2. **Insufficient admin permissions** in existing policies
3. **JWT token structure** may not be properly formatted for Supabase

### **🛠️ Solution:**
1. **Add RLS policies** for missing tables
2. **Update existing policies** to properly handle admin roles
3. **Test JWT token recognition** with Supabase
4. **Verify SimplyAvi's access** after fixes

### **✅ Expected Outcome:**
SimplyAvi should have full admin access to all data and functions without RLS restrictions.

---

**Next Steps:**
1. Create the RLS fix migration files
2. Run the migrations
3. Test JWT token recognition
4. Verify SimplyAvi's access
5. Document the solution for future reference 