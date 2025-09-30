-- Step-by-Step Tier System Migration
-- Author: Justin Linzan
-- Date: September 2025
-- 
-- This migration adds tier values step by step to avoid enum errors

-- =============================================================================
-- STEP 1: ADD NEW ENUM VALUES ONE BY ONE
-- =============================================================================

-- Add new enum values to existing user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'standard';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'premium';

-- =============================================================================
-- STEP 2: VERIFY ENUM VALUES WERE ADDED
-- =============================================================================

-- Check what values are now in the user_role enum
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- =============================================================================
-- STEP 3: UPDATE EXISTING USERS TO NEW TIER SYSTEM
-- =============================================================================

-- Update 'end_user' to 'free' tier (now that 'free' exists)
UPDATE "Users" SET role = 'free' WHERE role = 'end_user';

-- =============================================================================
-- STEP 4: ADD CUSTOM ALLERGENS COLUMN
-- =============================================================================

-- Add custom_allergens column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS custom_allergens JSONB DEFAULT '[]';

-- Create index for custom allergens queries
CREATE INDEX IF NOT EXISTS idx_users_custom_allergens ON "Users" USING GIN (custom_allergens);

-- =============================================================================
-- STEP 5: VERIFY THE CHANGES
-- =============================================================================

-- Show user distribution by role
SELECT 
    role,
    COUNT(*) as user_count,
    CASE 
        WHEN role = 'admin' THEN 'Admin (Full access)'
        WHEN role = 'seller' THEN 'Seller (Product management)'
        WHEN role = 'free' THEN 'Free (2 allergens max)'
        WHEN role = 'standard' THEN 'Standard (Unlimited + Custom)'
        WHEN role = 'premium' THEN 'Premium (All features)'
        ELSE 'Unknown'
    END as tier_description
FROM "Users" 
GROUP BY role 
ORDER BY role;

-- Show the new table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Users' 
    AND column_name IN ('role', 'custom_allergens')
ORDER BY column_name;
