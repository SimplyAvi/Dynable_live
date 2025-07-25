-- Fix RLS Policies for User Creation
-- This script adds the missing INSERT policy for the Users table

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "users_insert_own" ON "Users";

-- Add INSERT policy for users to create their own profile
CREATE POLICY "users_insert_own" ON "Users"
    FOR INSERT WITH CHECK (
        -- Allow users to create their own profile
        email = (auth.jwt() ->> 'email')::text OR
        -- Allow admins to create any user
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Also add a more permissive policy for authenticated users during signup
CREATE POLICY "authenticated_users_insert" ON "Users"
    FOR INSERT WITH CHECK (
        -- Allow any authenticated user to create a profile
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
    'RLS Policies Fixed' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'Users'; 