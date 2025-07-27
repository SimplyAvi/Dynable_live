-- Fix RLS Policies to Allow Email-Based Queries
-- This script updates the RLS policies to work with both UUID and email-based lookups

-- Drop existing policies
DROP POLICY IF EXISTS "users_insert_own" ON "Users";
DROP POLICY IF EXISTS "authenticated_users_insert" ON "Users";
DROP POLICY IF EXISTS "allow_user_creation" ON "Users";
DROP POLICY IF EXISTS "allow_email_based_creation" ON "Users";
DROP POLICY IF EXISTS "users_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_create_own_profile" ON "Users";
DROP POLICY IF EXISTS "admin_user_creation" ON "Users";
DROP POLICY IF EXISTS "users_view_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_update_own_profile" ON "Users";
DROP POLICY IF EXISTS "admin_user_updates" ON "Users";
DROP POLICY IF EXISTS "admin_users_all" ON "Users";
DROP POLICY IF EXISTS "users_update_own" ON "Users";
DROP POLICY IF EXISTS "admin_role_changes" ON "Users";
DROP POLICY IF EXISTS "admin_user_management" ON "Users";

-- Create comprehensive RLS policies that work with both UUID and email
-- Users can only see their own profile (by UUID or email)
CREATE POLICY "users_view_own_profile" ON "Users"
    FOR SELECT USING (
        -- User can see their own profile by UUID
        supabase_user_id = auth.uid() OR
        -- User can see their own profile by email (for existing users)
        (auth.uid() IS NOT NULL AND email = auth.email()) OR
        -- Admins can see all profiles
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can only create their own profile
CREATE POLICY "users_create_own_profile" ON "Users"
    FOR INSERT WITH CHECK (
        -- User can only create profile with their own Supabase UUID
        supabase_user_id = auth.uid() OR
        -- User can create profile with their own email
        (auth.uid() IS NOT NULL AND email = auth.email()) OR
        -- Allow admins to create any user
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can only update their own profile
CREATE POLICY "users_update_own_profile" ON "Users"
    FOR UPDATE USING (
        -- User can only update their own profile by UUID
        supabase_user_id = auth.uid() OR
        -- User can update their own profile by email
        (auth.uid() IS NOT NULL AND email = auth.email())
    ) WITH CHECK (
        -- Prevent role escalation (only admins can change roles)
        -- Note: We'll handle role protection in the application layer
        supabase_user_id = auth.uid() OR
        (auth.uid() IS NOT NULL AND email = auth.email())
    );

-- Admins can manage all users
CREATE POLICY "admin_user_management" ON "Users"
    FOR ALL USING (
        -- Admins can do everything
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Verify the policies
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'Users'
ORDER BY policyname; 