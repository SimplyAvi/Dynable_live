-- =============================================================================
-- COMPREHENSIVE RLS AND TIER SYSTEM VERIFICATION
-- Run this in Supabase SQL Editor to verify everything is configured correctly
-- =============================================================================

-- 1. Check if RLS is enabled on Users table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'Users';

-- 2. List all RLS policies on Users table
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'Users'
ORDER BY policyname;

-- 3. Check detailed policy definitions
SELECT 
    policyname,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'Users'
ORDER BY policyname;

-- 4. Check enum values for user_role
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_role', 'enum_Users_role')
ORDER BY t.typname, e.enumsortorder;

-- 5. Check test user's current configuration
SELECT 
    id,
    email,
    name,
    role,
    custom_allergens,
    supabase_user_id,
    "createdAt",
    "updatedAt"
FROM "Users" 
WHERE email = 'testjjuser@gmail.com';

-- 6. Check all users and their tiers
SELECT 
    email,
    role,
    CASE 
        WHEN role = 'free' THEN '2 allergens max, no custom'
        WHEN role = 'standard' THEN 'Unlimited allergens + custom'
        WHEN role = 'premium' THEN 'Unlimited + premium features'
        WHEN role = 'admin' THEN 'Full access'
        WHEN role = 'seller' THEN 'Unlimited + product management'
        ELSE 'Unknown tier'
    END as tier_capabilities,
    jsonb_array_length(custom_allergens) as custom_allergen_count,
    supabase_user_id IS NOT NULL as has_supabase_auth
FROM "Users"
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'seller' THEN 2
        WHEN 'premium' THEN 3
        WHEN 'standard' THEN 4
        WHEN 'free' THEN 5
        ELSE 6
    END,
    email;

-- 7. Verify column structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Users' 
  AND column_name IN ('role', 'custom_allergens', 'supabase_user_id', 'email')
ORDER BY ordinal_position;

-- =============================================================================
-- EXPECTED RESULTS:
-- =============================================================================
-- 1. RLS should be ENABLED (rls_enabled = true)
-- 2. Should have policies: users_view_own_profile, users_create_own_profile, users_update_own_profile
-- 3. Policies should include: "email = auth.email()" for email-based access
-- 4. Enum should have: free, standard, premium, admin, seller
-- 5. testjjuser@gmail.com should have role = 'standard'
-- 6. custom_allergens column should be JSONB type
-- =============================================================================
