-- Fix Orders Table RLS Policies
-- This script updates the RLS policies to work with both userId and supabase_user_id

-- Drop existing policies
DROP POLICY IF EXISTS "admin_orders_management" ON "Orders";
DROP POLICY IF EXISTS "permanent_users_create_orders" ON "Orders";
DROP POLICY IF EXISTS "users_create_own_orders" ON "Orders";
DROP POLICY IF EXISTS "users_own_orders" ON "Orders";
DROP POLICY IF EXISTS "users_update_own_orders" ON "Orders";
DROP POLICY IF EXISTS "users_view_own_orders" ON "Orders";

-- Create comprehensive RLS policies for Orders table
-- Users can only see their own orders
CREATE POLICY "users_view_own_orders" ON "Orders"
    FOR SELECT USING (
        -- User can see their own orders by UUID
        supabase_user_id = auth.uid() OR
        -- User can see their own orders by integer userId (for backward compatibility)
        (auth.uid() IS NOT NULL AND "userId"::text = auth.uid()::text) OR
        -- Admins can see all orders
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can only create their own orders
CREATE POLICY "users_create_own_orders" ON "Orders"
    FOR INSERT WITH CHECK (
        -- User can only create orders with their own Supabase UUID
        supabase_user_id = auth.uid() OR
        -- User can create orders with their own integer userId
        (auth.uid() IS NOT NULL AND "userId"::text = auth.uid()::text) OR
        -- Allow admins to create any order
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can only update their own orders
CREATE POLICY "users_update_own_orders" ON "Orders"
    FOR UPDATE USING (
        -- User can only update their own orders by UUID
        supabase_user_id = auth.uid() OR
        -- User can update their own orders by integer userId
        (auth.uid() IS NOT NULL AND "userId"::text = auth.uid()::text)
    ) WITH CHECK (
        -- Prevent changing ownership
        supabase_user_id = auth.uid() OR
        (auth.uid() IS NOT NULL AND "userId"::text = auth.uid()::text)
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