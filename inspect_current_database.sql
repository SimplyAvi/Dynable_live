-- Inspect Current Database State Before Migration
-- Author: Justin Linzan
-- Date: September 2025
-- 
-- This script safely inspects the current database state without making changes

-- =============================================================================
-- STEP 1: CHECK CURRENT USER_ROLE ENUM VALUES
-- =============================================================================

-- Check what values are currently in the user_role enum
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- =============================================================================
-- STEP 2: CHECK CURRENT USERS AND THEIR ROLES
-- =============================================================================

-- Show all users and their current roles
SELECT 
    id,
    email,
    name,
    role,
    "createdAt",
    "updatedAt"
FROM "Users" 
ORDER BY role, email;

-- Count users by role
SELECT 
    role,
    COUNT(*) as user_count
FROM "Users" 
GROUP BY role 
ORDER BY role;

-- =============================================================================
-- STEP 3: CHECK IF CUSTOM_ALLERGENS COLUMN EXISTS
-- =============================================================================

-- Check if custom_allergens column already exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Users' 
    AND column_name = 'custom_allergens';

-- =============================================================================
-- STEP 4: CHECK CURRENT RLS POLICIES
-- =============================================================================

-- Show current RLS policies on Users table
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'Users'
ORDER BY policyname;

-- =============================================================================
-- STEP 5: SAFETY SUMMARY
-- =============================================================================

-- Show what would be affected by the migration
SELECT 
    'SAFETY CHECK SUMMARY' as status,
    (SELECT COUNT(*) FROM "Users" WHERE role = 'seller') as seller_count,
    (SELECT COUNT(*) FROM "Users" WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM "Users" WHERE role = 'end_user') as end_user_count,
    (SELECT COUNT(*) FROM "Users") as total_users;
