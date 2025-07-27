-- Fix RLS Policies for User Creation - Version 2
-- This script creates more permissive policies that work with Supabase client

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "users_insert_own" ON "Users";
DROP POLICY IF EXISTS "authenticated_users_insert" ON "Users";

-- Create a simple INSERT policy that allows any authenticated user to create a profile
CREATE POLICY "allow_user_creation" ON "Users"
    FOR INSERT WITH CHECK (
        -- Allow any authenticated user to create their profile
        auth.uid() IS NOT NULL
    );

-- Also add a policy for email-based creation (for Google OAuth)
CREATE POLICY "allow_email_based_creation" ON "Users"
    FOR INSERT WITH CHECK (
        -- Allow creation if email matches authenticated user
        email = (auth.jwt() ->> 'email')::text OR
        -- Or if user is authenticated (fallback)
        auth.uid() IS NOT NULL
    );

-- Add a more permissive SELECT policy for debugging
DROP POLICY IF EXISTS "users_own_profile" ON "Users";
CREATE POLICY "users_own_profile" ON "Users"
    FOR SELECT USING (
        -- Allow users to see their own profile
        email = (auth.jwt() ->> 'email')::text OR
        -- Allow admins to see all
        (auth.jwt() ->> 'role')::text = 'admin' OR
        -- Allow authenticated users to see their profile
        auth.uid() IS NOT NULL
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
    'RLS Policies Updated' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'Users'; 