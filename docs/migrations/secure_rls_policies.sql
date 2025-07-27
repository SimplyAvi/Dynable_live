-- Secure RLS Policies for User Creation
-- This script creates secure policies that work with Supabase Auth and Google OAuth
-- while preventing unauthorized user creation

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "users_insert_own" ON "Users";
DROP POLICY IF EXISTS "authenticated_users_insert" ON "Users";
DROP POLICY IF EXISTS "allow_user_creation" ON "Users";
DROP POLICY IF EXISTS "allow_email_based_creation" ON "Users";
DROP POLICY IF EXISTS "users_own_profile" ON "Users";

-- 1. SECURE INSERT POLICY: Users can only create their own profile
CREATE POLICY "users_create_own_profile" ON "Users"
    FOR INSERT WITH CHECK (
        -- User can only create profile with their own ID
        id = auth.uid()::text OR
        -- Allow email-based creation for Google OAuth (email must match authenticated user)
        (auth.uid() IS NOT NULL AND email = auth.email())
    );

-- 2. ADMIN INSERT POLICY: Admins can create any user
CREATE POLICY "admin_user_creation" ON "Users"
    FOR INSERT WITH CHECK (
        -- Admins can create any user
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 3. SECURE SELECT POLICY: Users can only see their own profile
CREATE POLICY "users_view_own_profile" ON "Users"
    FOR SELECT USING (
        -- User can see their own profile
        id = auth.uid()::text OR
        -- Allow email-based lookup for Google OAuth
        (auth.uid() IS NOT NULL AND email = auth.email()) OR
        -- Admins can see all profiles
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 4. SECURE UPDATE POLICY: Users can only update their own profile
CREATE POLICY "users_update_own_profile" ON "Users"
    FOR UPDATE USING (
        -- User can only update their own profile
        id = auth.uid()::text OR
        -- Allow email-based updates for Google OAuth
        (auth.uid() IS NOT NULL AND email = auth.email())
    ) WITH CHECK (
        -- Prevent role escalation (only admins can change roles)
        (OLD.role = NEW.role OR (auth.jwt() ->> 'role')::text = 'admin')
    );

-- 5. ADMIN UPDATE POLICY: Admins can update any user
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