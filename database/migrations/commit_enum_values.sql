-- Commit Enum Values First
-- Author: Justin Linzan
-- Date: September 2025
-- 
-- This script commits the enum values in separate transactions

-- =============================================================================
-- STEP 1: ADD ENUM VALUES (This will be committed automatically)
-- =============================================================================

-- Add values to the actual enum type used by the column
ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'standard';
ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'premium';

-- =============================================================================
-- STEP 2: VERIFY ENUM VALUES WERE ADDED
-- =============================================================================

-- Check what values are now in the enum_Users_role enum
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'enum_Users_role'
ORDER BY e.enumsortorder;
