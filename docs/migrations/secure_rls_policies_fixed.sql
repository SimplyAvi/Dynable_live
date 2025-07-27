-- Secure RLS Policies for User Creation - FIXED VERSION
-- This script creates secure policies that work with Supabase Auth and Google OAuth
-- while preventing unauthorized user creation

-- Drop existing policies to start fresh
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

-- 1. SECURE INSERT POLICY: Users can only create their own profile
-- Note: We use email-based matching since auth.uid() is UUID and Users.id is integer
CREATE POLICY "users_create_own_profile" ON "Users"
    FOR INSERT WITH CHECK (
        -- Allow email-based creation for Google OAuth (email must match authenticated user)
        (auth.uid() IS NOT NULL AND email = auth.email()) OR
        -- Allow admins to create any user
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 2. SECURE SELECT POLICY: Users can only see their own profile
CREATE POLICY "users_view_own_profile" ON "Users"
    FOR SELECT USING (
        -- Allow email-based lookup for Google OAuth
        (auth.uid() IS NOT NULL AND email = auth.email()) OR
        -- Admins can see all profiles
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 3. SECURE UPDATE POLICY: Users can only update their own profile
CREATE POLICY "users_update_own_profile" ON "Users"
    FOR UPDATE USING (
        -- Allow email-based updates for Google OAuth
        (auth.uid() IS NOT NULL AND email = auth.email())
    ) WITH CHECK (
        -- Prevent role escalation (only admins can change roles)
        (OLD.role = NEW.role OR (auth.jwt() ->> 'role')::text = 'admin')
    );

-- 4. ADMIN UPDATE POLICY: Admins can update any user
CREATE POLICY "admin_user_updates" ON "Users"
    FOR UPDATE USING (
        -- Admins can update any user
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

-- Test the policies
SELECT 
    'Secure RLS Policies Applied' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'Users';

-- Show policy details for verification
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'Users'
ORDER BY policyname; 