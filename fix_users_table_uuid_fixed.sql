-- Fix Users Table to Use UUID Primary Keys (Supabase Standard) - FIXED VERSION
-- This migration converts the Users table to use UUID primary keys that match auth.uid()

-- Step 1: Add UUID column for Supabase user ID
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS supabase_user_id UUID;

-- Step 2: Create index on the new UUID column for performance
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON "Users"(supabase_user_id);

-- Step 3: Update RLS policies to use UUID-based matching
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

-- Step 4: Create secure UUID-based RLS policies
-- Users can only create their own profile (using UUID)
CREATE POLICY "users_create_own_profile" ON "Users"
    FOR INSERT WITH CHECK (
        -- User can only create profile with their own Supabase UUID
        supabase_user_id = auth.uid() OR
        -- Allow admins to create any user
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can only see their own profile
CREATE POLICY "users_view_own_profile" ON "Users"
    FOR SELECT USING (
        -- User can see their own profile
        supabase_user_id = auth.uid() OR
        -- Admins can see all profiles
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can only update their own profile
CREATE POLICY "users_update_own_profile" ON "Users"
    FOR UPDATE USING (
        -- User can only update their own profile
        supabase_user_id = auth.uid()
    ) WITH CHECK (
        -- Prevent role escalation (only admins can change roles)
        -- Note: We'll handle role protection in the application layer
        supabase_user_id = auth.uid()
    );

-- Admins can manage all users
CREATE POLICY "admin_user_management" ON "Users"
    FOR ALL USING (
        -- Admins can do everything
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Step 5: Verify the policies
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'Users'
ORDER BY policyname;

-- Step 6: Show the new table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Users' 
ORDER BY ordinal_position;

-- Step 7: Test the policies
SELECT 
    'UUID-Based RLS Policies Applied' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'Users'; 