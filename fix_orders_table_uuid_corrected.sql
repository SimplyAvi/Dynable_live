-- Fix Orders Table to Use UUID for userId - CORRECTED VERSION
-- This migration updates the Orders table to use UUID for userId to match Supabase Auth

-- Step 1: Add a new UUID column for Supabase user ID
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS supabase_user_id UUID;

-- Step 2: Create index on the new UUID column for performance
CREATE INDEX IF NOT EXISTS idx_orders_supabase_user_id ON "Orders"(supabase_user_id);

-- Step 3: Update RLS policies for Orders table
-- Drop existing policies
DROP POLICY IF EXISTS "users_view_own_orders" ON "Orders";
DROP POLICY IF EXISTS "users_create_own_orders" ON "Orders";
DROP POLICY IF EXISTS "admin_orders_all" ON "Orders";
DROP POLICY IF EXISTS "admin_orders_management" ON "Orders";

-- Create new RLS policies for Orders table
-- Users can only see their own orders
CREATE POLICY "users_view_own_orders" ON "Orders"
    FOR SELECT USING (
        -- User can see their own orders by UUID
        supabase_user_id = auth.uid() OR
        -- Admins can see all orders
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can only create their own orders
CREATE POLICY "users_create_own_orders" ON "Orders"
    FOR INSERT WITH CHECK (
        -- User can only create orders with their own Supabase UUID
        supabase_user_id = auth.uid() OR
        -- Allow admins to create any order
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Admins can manage all orders
CREATE POLICY "admin_orders_management" ON "Orders"
    FOR ALL USING (
        -- Admins can do everything
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Step 4: Show the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Orders' 
ORDER BY ordinal_position;

-- Step 5: Verify the policies
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'Orders'
ORDER BY policyname; 