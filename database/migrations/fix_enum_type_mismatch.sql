-- Fix Enum Type Mismatch
-- Author: Justin Linzan
-- Date: September 2025
-- 
-- The issue is that the column uses 'enum_Users_role' but we created 'user_role'
-- We need to either update the column type or use the correct enum

-- =============================================================================
-- STEP 1: CHECK WHAT ENUM TYPES EXIST
-- =============================================================================

-- Check what enum types exist in the database
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname LIKE '%role%'
ORDER BY t.typname, e.enumsortorder;

-- =============================================================================
-- STEP 2: CHECK THE ACTUAL COLUMN TYPE
-- =============================================================================

-- Check what type the role column actually uses
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'Users' 
    AND column_name = 'role';

-- =============================================================================
-- STEP 3: ADD VALUES TO THE CORRECT ENUM TYPE
-- =============================================================================

-- Add values to the actual enum type used by the column (enum_Users_role)
ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'standard';
ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'premium';

-- =============================================================================
-- STEP 4: NOW TRY THE UPDATE WITH THE CORRECT ENUM TYPE
-- =============================================================================

-- Update using the correct enum type
UPDATE "Users" 
SET role = 'free'::"enum_Users_role" 
WHERE role = 'end_user';

-- =============================================================================
-- STEP 5: VERIFY THE UPDATE WORKED
-- =============================================================================

-- Check if the update worked
SELECT 
    id,
    email,
    role,
    "createdAt"
FROM "Users" 
WHERE role = 'free';

-- Show all users and their roles
SELECT 
    role,
    COUNT(*) as user_count
FROM "Users" 
GROUP BY role 
ORDER BY role;
