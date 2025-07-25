-- Fix Orders Table RLS Policies - UUID-ONLY VERSION
-- This script updates the RLS policies to use only UUID matching, avoiding type conversion issues

-- Drop existing policies
DROP POLICY IF EXISTS "admin_orders_management" ON "Orders";
DROP POLICY IF EXISTS "permanent_users_create_orders" ON "Orders";
DROP POLICY IF EXISTS "users_create_own_orders" ON "Orders";
DROP POLICY IF EXISTS "users_own_orders" ON "Orders";
DROP POLICY IF EXISTS "users_update_own_orders" ON "Orders";
DROP POLICY IF EXISTS "users_view_own_orders" ON "Orders";

-- Create comprehensive RLS policies for Orders table - UUID-ONLY
-- Users can only see their own orders
CREATE POLICY "users_view_own_orders" ON "Orders"
    FOR SELECT USING (
        -- User can see their own orders by UUID only
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

-- Users can only update their own orders
CREATE POLICY "users_update_own_orders" ON "Orders"
    FOR UPDATE USING (
        -- User can only update their own orders by UUID
        supabase_user_id = auth.uid()
    ) WITH CHECK (
        -- Prevent changing ownership
        supabase_user_id = auth.uid()
    );

-- Admins can manage all orders
CREATE POLICY "admin_orders_management" ON "Orders"
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
WHERE tablename = 'Orders'
ORDER BY policyname; 