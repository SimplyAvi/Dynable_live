-- Fix Carts Table Constraints for Anonymous Auth
-- Author: Justin Linzan
-- Date: January 2025

-- =============================================================================
-- STEP 1: FIX CARTS TABLE CONSTRAINTS
-- =============================================================================

-- Make userId nullable since we're using supabase_user_id for anonymous users
ALTER TABLE "Carts" 
ALTER COLUMN "userId" DROP NOT NULL;

-- Ensure supabase_user_id column exists
ALTER TABLE "Carts" 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID REFERENCES auth.users(id);

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_carts_supabase_user_id ON "Carts"(supabase_user_id);

-- =============================================================================
-- STEP 2: UPDATE RLS POLICIES TO USE SUPABASE_USER_ID
-- =============================================================================

-- Drop existing cart policies
DROP POLICY IF EXISTS "users_own_cart" ON "Carts";
DROP POLICY IF EXISTS "anonymous_cart_access" ON "Carts";
DROP POLICY IF EXISTS "anonymous_cart_modify" ON "Carts";
DROP POLICY IF EXISTS "anonymous_cart_update" ON "Carts";
DROP POLICY IF EXISTS "permanent_user_cart_access" ON "Carts";
DROP POLICY IF EXISTS "admin_cart_access" ON "Carts";

-- Create new RLS policies that work with both userId and supabase_user_id
-- Anonymous users can access their own cart (using supabase_user_id)
CREATE POLICY "anonymous_cart_access" ON "Carts"
    FOR ALL USING (
        supabase_user_id = auth.uid()
    );

-- Permanent users can access their own cart (using either userId or supabase_user_id)
CREATE POLICY "permanent_user_cart_access" ON "Carts"
    FOR ALL USING (
        supabase_user_id = auth.uid() OR 
        "userId"::text = auth.uid()::text
    );

-- Admins can access all carts
CREATE POLICY "admin_cart_access" ON "Carts"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- =============================================================================
-- STEP 3: VERIFY THE FIX
-- =============================================================================

-- Check the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Carts' 
ORDER BY ordinal_position;

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'Carts'; 