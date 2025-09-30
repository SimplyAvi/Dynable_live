-- Fix Enum Issue - Alternative Approach
-- Author: Justin Linzan
-- Date: September 2025
-- 
-- This handles the enum issue by using a different approach

-- =============================================================================
-- STEP 1: CHECK CURRENT ENUM VALUES AGAIN
-- =============================================================================

-- Double-check what's actually in the enum
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- =============================================================================
-- STEP 2: TRY ALTERNATIVE APPROACH - USE TEXT CONVERSION
-- =============================================================================

-- Try updating using text conversion (this sometimes works when direct enum fails)
UPDATE "Users" 
SET role = 'free'::text::user_role 
WHERE role = 'end_user';

-- If that doesn't work, let's try a different approach
-- First, let's see what the current users look like
SELECT 
    id,
    email,
    role,
    role::text as role_as_text
FROM "Users" 
WHERE role = 'end_user';

-- =============================================================================
-- STEP 3: ALTERNATIVE - UPDATE VIA TEXT INTERMEDIARY
-- =============================================================================

-- If the above fails, try this approach:
-- 1. Add a temporary text column
-- 2. Update the text column
-- 3. Convert back to enum
-- 4. Drop the temporary column

-- Add temporary text column
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS temp_role TEXT;

-- Update the text column
UPDATE "Users" 
SET temp_role = 'free' 
WHERE role = 'end_user';

-- Convert text to enum
UPDATE "Users" 
SET role = temp_role::user_role 
WHERE temp_role = 'free';

-- Drop temporary column
ALTER TABLE "Users" DROP COLUMN IF EXISTS temp_role;

-- =============================================================================
-- STEP 4: VERIFY THE UPDATE WORKED
-- =============================================================================

-- Check if the update worked
SELECT 
    id,
    email,
    role,
    "createdAt"
FROM "Users" 
WHERE email LIKE '%test%' OR role = 'free';

-- Show all users and their roles
SELECT 
    role,
    COUNT(*) as user_count
FROM "Users" 
GROUP BY role 
ORDER BY role;
