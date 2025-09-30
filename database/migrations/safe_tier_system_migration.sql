-- SAFE User Tier System Migration (Preserves Existing Roles)
-- Author: Justin Linzan
-- Date: September 2025
-- 
-- This migration safely adds new tier values without destroying existing roles
-- - Preserves 'admin' and 'seller' roles
-- - Adds new tier values: 'free', 'standard', 'premium'
-- - Updates 'end_user' to 'free' tier
-- - Adds custom_allergens column

-- =============================================================================
-- STEP 1: SAFELY ADD NEW ENUM VALUES (Preserves Existing)
-- =============================================================================

-- Add new enum values to existing user_role enum
-- This is safer than dropping and recreating
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'standard';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'premium';

-- =============================================================================
-- STEP 2: UPDATE EXISTING USERS TO NEW TIER SYSTEM
-- =============================================================================

-- Update 'end_user' to 'free' tier (if end_user exists)
UPDATE "Users" SET role = 'free' WHERE role = 'end_user';

-- Keep 'admin' and 'seller' roles unchanged
-- (No changes needed - they remain as-is)

-- =============================================================================
-- STEP 3: ADD CUSTOM ALLERGENS COLUMN
-- =============================================================================

-- Add custom_allergens column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS custom_allergens JSONB DEFAULT '[]';

-- Create index for custom allergens queries
CREATE INDEX IF NOT EXISTS idx_users_custom_allergens ON "Users" USING GIN (custom_allergens);

-- =============================================================================
-- STEP 4: UPDATE RLS POLICIES (Preserves Existing)
-- =============================================================================

-- Drop existing user policies (we'll recreate them)
DROP POLICY IF EXISTS "admin_users_all" ON "Users";
DROP POLICY IF EXISTS "users_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_update_own" ON "Users";
DROP POLICY IF EXISTS "users_insert" ON "Users";
DROP POLICY IF EXISTS "users_create_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_view_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_update_own_profile" ON "Users";
DROP POLICY IF EXISTS "admin_user_management" ON "Users";
DROP POLICY IF EXISTS "admin_role_changes" ON "Users";
DROP POLICY IF EXISTS "custom_allergens_tier_restriction" ON "Users";

-- Create new tier-based RLS policies
-- Policy 1: Users can view their own profile
CREATE POLICY "users_view_own_profile" ON "Users"
    FOR SELECT USING (
        supabase_user_id = auth.uid() OR
        email = auth.email() OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Policy 2: Users can create their own profile
CREATE POLICY "users_create_own_profile" ON "Users"
    FOR INSERT WITH CHECK (
        supabase_user_id = auth.uid() OR
        email = auth.email() OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Policy 3: Users can update their own profile (with tier restrictions)
CREATE POLICY "users_update_own_profile" ON "Users"
    FOR UPDATE USING (
        supabase_user_id = auth.uid() OR
        email = auth.email() OR
        (auth.jwt() ->> 'role')::text = 'admin'
    ) WITH CHECK (
        -- Prevent role escalation (only admins can change roles)
        (OLD.role = NEW.role OR (auth.jwt() ->> 'role')::text = 'admin') AND
        -- Only Standard+ users can have custom allergens
        (
            NEW.custom_allergens IS NULL OR 
            NEW.custom_allergens = '[]' OR
            NEW.role IN ('standard', 'premium', 'admin', 'seller') OR
            (auth.jwt() ->> 'role')::text = 'admin'
        )
    );

-- Policy 4: Admins have full access
CREATE POLICY "admin_full_access" ON "Users"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- =============================================================================
-- STEP 5: VERIFY THE MIGRATION
-- =============================================================================

-- Show the new enum values
SELECT unnest(enum_range(NULL::user_role)) as role_values;

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
    AND column_name IN ('role', 'custom_allergens', 'supabase_user_id', 'email')
ORDER BY column_name;
