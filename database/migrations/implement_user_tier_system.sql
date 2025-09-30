-- Implement User Tier System with Custom Allergen Support
-- Author: Justin Linzan
-- Date: September 2025
-- 
-- This migration implements the new user tier system:
-- - Free: 2 allergen limit, no custom allergens
-- - Standard: Unlimited allergens + custom allergens
-- - Premium: Hidden for now, admin-only
-- - Fixes RLS policies for custom allergen functionality

-- =============================================================================
-- STEP 1: UPDATE USER ROLE ENUM TO INCLUDE TIERS
-- =============================================================================

-- Drop existing enum and recreate with new values
DROP TYPE IF EXISTS user_role CASCADE;

-- Create new enum with tier system
CREATE TYPE user_role AS ENUM (
    'admin',           -- Full access, can see premium features
    'free',            -- 2 allergen limit, no custom allergens
    'standard',        -- Unlimited allergens + custom allergens
    'premium',         -- Hidden tier (future features)
    'seller'           -- Seller role (unchanged)
);

-- Update Users table to use new enum
ALTER TABLE "Users" ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Set default to 'free' for new users
ALTER TABLE "Users" ALTER COLUMN role SET DEFAULT 'free';

-- Update existing 'end_user' to 'free' tier
UPDATE "Users" SET role = 'free' WHERE role = 'end_user';

-- =============================================================================
-- STEP 2: ADD CUSTOM ALLERGENS COLUMN TO USERS TABLE
-- =============================================================================

-- Add custom_allergens column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS custom_allergens JSONB DEFAULT '[]';

-- Create index for custom allergens queries
CREATE INDEX IF NOT EXISTS idx_users_custom_allergens ON "Users" USING GIN (custom_allergens);

-- =============================================================================
-- STEP 3: DROP EXISTING RLS POLICIES
-- =============================================================================

-- Drop all existing user policies
DROP POLICY IF EXISTS "admin_users_all" ON "Users";
DROP POLICY IF EXISTS "users_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_update_own" ON "Users";
DROP POLICY IF EXISTS "users_insert" ON "Users";
DROP POLICY IF EXISTS "users_create_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_view_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_update_own_profile" ON "Users";
DROP POLICY IF EXISTS "admin_user_management" ON "Users";
DROP POLICY IF EXISTS "admin_role_changes" ON "Users";

-- =============================================================================
-- STEP 4: CREATE NEW TIER-BASED RLS POLICIES
-- =============================================================================

-- Policy 1: Users can view their own profile
CREATE POLICY "users_view_own_profile" ON "Users"
    FOR SELECT USING (
        -- User can see their own profile by UUID
        supabase_user_id = auth.uid() OR
        -- User can see their own profile by email (for compatibility)
        email = auth.email() OR
        -- Admins can see all profiles
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Policy 2: Users can create their own profile
CREATE POLICY "users_create_own_profile" ON "Users"
    FOR INSERT WITH CHECK (
        -- User can only create profile with their own UUID
        supabase_user_id = auth.uid() OR
        -- User can create profile with their own email
        email = auth.email() OR
        -- Admins can create any user
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Policy 3: Users can update their own profile (with tier restrictions)
CREATE POLICY "users_update_own_profile" ON "Users"
    FOR UPDATE USING (
        -- User can only update their own profile
        supabase_user_id = auth.uid() OR
        email = auth.email() OR
        -- Admins can update any profile
        (auth.jwt() ->> 'role')::text = 'admin'
    ) WITH CHECK (
        -- Prevent role escalation (only admins can change roles)
        (OLD.role = NEW.role OR (auth.jwt() ->> 'role')::text = 'admin') AND
        -- Only Standard+ users can have custom allergens
        (
            NEW.custom_allergens IS NULL OR 
            NEW.custom_allergens = '[]' OR
            NEW.role IN ('standard', 'premium', 'admin') OR
            (auth.jwt() ->> 'role')::text = 'admin'
        )
    );

-- Policy 4: Admins have full access
CREATE POLICY "admin_full_access" ON "Users"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- =============================================================================
-- STEP 5: CREATE HELPER FUNCTIONS FOR TIER CHECKS
-- =============================================================================

-- Function to check if user can toggle more allergens
CREATE OR REPLACE FUNCTION can_toggle_allergen(user_id UUID, current_allergen_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    max_allergens INTEGER;
BEGIN
    -- Get user's role
    SELECT role::text INTO user_role 
    FROM "Users" 
    WHERE supabase_user_id = user_id;
    
    -- Determine max allergens based on tier
    CASE user_role
        WHEN 'free' THEN max_allergens := 2;
        WHEN 'standard', 'premium', 'admin' THEN max_allergens := 999; -- Effectively unlimited
        ELSE max_allergens := 0; -- Unknown role
    END CASE;
    
    -- Check if user can toggle more
    RETURN current_allergen_count < max_allergens;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can add custom allergens
CREATE OR REPLACE FUNCTION can_add_custom_allergen(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get user's role
    SELECT role::text INTO user_role 
    FROM "Users" 
    WHERE supabase_user_id = user_id;
    
    -- Only Standard+ users can add custom allergens
    RETURN user_role IN ('standard', 'premium', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 6: CREATE RLS POLICIES FOR CUSTOM ALLERGENS
-- =============================================================================

-- Policy for custom allergens: Only Standard+ users can modify
CREATE POLICY "custom_allergens_tier_restriction" ON "Users"
    FOR UPDATE USING (
        -- User can only modify their own custom allergens
        supabase_user_id = auth.uid() OR
        email = auth.email() OR
        -- Admins can modify any user's custom allergens
        (auth.jwt() ->> 'role')::text = 'admin'
    ) WITH CHECK (
        -- Only Standard+ users can have custom allergens
        (
            NEW.custom_allergens IS NULL OR 
            NEW.custom_allergens = '[]' OR
            NEW.role IN ('standard', 'premium', 'admin') OR
            (auth.jwt() ->> 'role')::text = 'admin'
        )
    );

-- =============================================================================
-- STEP 7: VERIFY THE IMPLEMENTATION
-- =============================================================================

-- Show the new enum values
SELECT unnest(enum_range(NULL::user_role)) as role_values;

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

-- Show the new RLS policies
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

-- Test the helper functions
SELECT 
    'Helper Functions Created' as status,
    can_toggle_allergen('00000000-0000-0000-0000-000000000000'::UUID, 1) as free_user_can_toggle,
    can_add_custom_allergen('00000000-0000-0000-0000-000000000000'::UUID) as free_user_can_add_custom;

-- =============================================================================
-- STEP 8: SUMMARY
-- =============================================================================

SELECT 
    'User Tier System Implementation Complete' as status,
    'Free: 2 allergens, Standard: Unlimited+Custom, Premium: Hidden' as tier_description,
    COUNT(*) as total_users
FROM "Users";

-- Show user distribution by tier
SELECT 
    role,
    COUNT(*) as user_count
FROM "Users" 
GROUP BY role 
ORDER BY role;
