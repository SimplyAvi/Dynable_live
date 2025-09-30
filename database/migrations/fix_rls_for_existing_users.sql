-- Fix RLS policies to allow access for existing users who are not in Supabase Auth
-- Author: Justin Linzan
-- Date: September 2025
-- 
-- This migration updates RLS policies to allow users who exist in the custom Users table
-- but are not authenticated through Supabase Auth to still access their data

-- =============================================================================
-- STEP 1: UPDATE EXISTING RLS POLICIES TO ALLOW EMAIL-BASED ACCESS
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_view_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_create_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_update_own_profile" ON "Users";

-- Create updated policies that allow access by email for existing users
-- Policy 1: Users can view their own profile (by UUID or email)
CREATE POLICY "users_view_own_profile" ON "Users"
    FOR SELECT USING (
        -- User can see their own profile by UUID (for Supabase Auth users)
        supabase_user_id = auth.uid() OR
        -- User can see their own profile by email (for existing users not in Supabase Auth)
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
        -- User can update their own profile by UUID or email
        supabase_user_id = auth.uid() OR
        email = auth.email() OR
        -- Admins can update any user
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

-- =============================================================================
-- STEP 2: ADD POLICY FOR CUSTOM ALLERGENS ACCESS
-- =============================================================================

-- Policy 4: Custom allergens access based on tier
CREATE POLICY "custom_allergens_tier_restriction" ON "Users"
    FOR UPDATE USING (
        -- User can update their own profile
        supabase_user_id = auth.uid() OR
        email = auth.email() OR
        -- Admins can update any user
        (auth.jwt() ->> 'role')::text = 'admin'
    ) WITH CHECK (
        -- Only Standard+ users can have custom allergens
        (
            NEW.custom_allergens IS NULL OR 
            NEW.custom_allergens = '[]' OR
            NEW.role IN ('standard', 'premium', 'admin', 'seller') OR
            (auth.jwt() ->> 'role')::text = 'admin'
        )
    );

-- =============================================================================
-- STEP 3: VERIFY POLICIES ARE WORKING
-- =============================================================================

-- Test query to verify policies work
-- This should return the user if they exist and have proper access
SELECT 
    id,
    email,
    role,
    custom_allergens,
    supabase_user_id
FROM "Users" 
WHERE email = 'testjjuser@gmail.com';

-- =============================================================================
-- STEP 4: ADD DEBUGGING INFORMATION
-- =============================================================================

-- Add a comment to track this migration
COMMENT ON POLICY "users_view_own_profile" ON "Users" IS 
'Updated to allow access by email for existing users not in Supabase Auth';

COMMENT ON POLICY "users_create_own_profile" ON "Users" IS 
'Updated to allow creation by email for existing users not in Supabase Auth';

COMMENT ON POLICY "users_update_own_profile" ON "Users" IS 
'Updated to allow updates by email for existing users not in Supabase Auth';
