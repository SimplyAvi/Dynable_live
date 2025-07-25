-- Fix Orders Table Constraints for Anonymous Auth
-- Author: Justin Linzan
-- Date: January 2025

-- =============================================================================
-- STEP 1: FIX ORDERS TABLE CONSTRAINTS
-- =============================================================================

-- Make userId nullable since we're using supabase_user_id for anonymous users
ALTER TABLE "Orders" 
ALTER COLUMN "userId" DROP NOT NULL;

-- Ensure supabase_user_id column exists
ALTER TABLE "Orders" 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID REFERENCES auth.users(id);

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_supabase_user_id ON "Orders"(supabase_user_id);

-- =============================================================================
-- STEP 2: UPDATE RLS POLICIES TO USE SUPABASE_USER_ID
-- =============================================================================

-- Drop existing order policies
DROP POLICY IF EXISTS "users_own_orders" ON "Orders";
DROP POLICY IF EXISTS "anonymous_order_access" ON "Orders";
DROP POLICY IF EXISTS "admin_order_access" ON "Orders";

-- Create new RLS policies that work with both userId and supabase_user_id
-- Anonymous users can access their own orders (using supabase_user_id)
CREATE POLICY "anonymous_order_access" ON "Orders"
    FOR ALL USING (
        supabase_user_id = auth.uid()
    );

-- Permanent users can access their own orders (using either userId or supabase_user_id)
CREATE POLICY "permanent_user_order_access" ON "Orders"
    FOR ALL USING (
        supabase_user_id = auth.uid() OR 
        "userId"::text = auth.uid()::text
    );

-- Admins can access all orders
CREATE POLICY "admin_order_access" ON "Orders"
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
WHERE table_name = 'Orders' 
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
WHERE tablename = 'Orders'; 