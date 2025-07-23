-- Database Migration Verification Script
-- This script verifies that Phase 1 and Phase 2 migrations have been applied correctly

-- 1. Check if user_role enum exists
SELECT 
    'User Role Enum' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 2. Check if role column exists in Users table
SELECT 
    'Users Role Column' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Users' AND column_name = 'role'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 3. Check if seller fields exist in Users table
SELECT 
    'Users Seller Fields' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Users' AND column_name = 'store_name'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Users' AND column_name = 'is_verified_seller'
        )
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 4. Check if anonymous user fields exist
SELECT 
    'Users Anonymous Fields' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Users' AND column_name = 'converted_from_anonymous'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Users' AND column_name = 'anonymous_cart_data'
        )
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 5. Check if admin_actions table exists
SELECT 
    'Admin Actions Table' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_actions') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 6. Check if seller_id exists in IngredientCategorized table
SELECT 
    'Products Seller ID' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'IngredientCategorized' AND column_name = 'seller_id'
        )
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 7. Check if RLS is enabled on key tables
SELECT 
    'RLS Enabled - Users' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'Users' AND rowsecurity = true
        )
        THEN '✅ ENABLED' 
        ELSE '❌ DISABLED' 
    END as status;

SELECT 
    'RLS Enabled - IngredientCategorized' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'IngredientCategorized' AND rowsecurity = true
        )
        THEN '✅ ENABLED' 
        ELSE '❌ DISABLED' 
    END as status;

SELECT 
    'RLS Enabled - Carts' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'Carts' AND rowsecurity = true
        )
        THEN '✅ ENABLED' 
        ELSE '❌ DISABLED' 
    END as status;

-- 8. Check if RLS policies exist
SELECT 
    'RLS Policies Count' as check_name,
    COUNT(*) || ' policies found' as status
FROM pg_policies 
WHERE tablename IN ('Users', 'IngredientCategorized', 'Carts', 'Orders', 'admin_actions');

-- 9. Check current user roles
SELECT 
    'Current User Roles' as check_name,
    COUNT(*) || ' users total' as status
FROM "Users";

SELECT 
    role as user_role,
    COUNT(*) as count
FROM "Users" 
GROUP BY role 
ORDER BY role;

-- 10. Check product ownership
SELECT 
    'Product Ownership' as check_name,
    COUNT(*) || ' products total' as status
FROM "IngredientCategorized";

SELECT 
    CASE 
        WHEN seller_id IS NULL THEN 'No Seller'
        ELSE 'Has Seller'
    END as ownership_status,
    COUNT(*) as count
FROM "IngredientCategorized" 
GROUP BY seller_id IS NULL 
ORDER BY ownership_status;

-- Summary
SELECT 
    '=== MIGRATION VERIFICATION SUMMARY ===' as summary;

SELECT 
    'If all checks show ✅ EXISTS/ENABLED, your migrations are complete!' as message; 