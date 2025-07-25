-- Anonymous Auth Setup for Supabase
-- Phase 1: Enable Anonymous Auth and Update RLS Policies
-- Author: Justin Linzan
-- Date: January 2025

-- =============================================================================
-- STEP 1: ENABLE ANONYMOUS AUTH (DO THIS IN SUPABASE DASHBOARD)
-- =============================================================================
-- Go to Supabase Dashboard → Authentication → Settings
-- Enable "Enable anonymous sign-ins"
-- This allows supabase.auth.signInAnonymously()

-- =============================================================================
-- STEP 2: UPDATE CARTS TABLE FOR ANONYMOUS USERS
-- =============================================================================

-- Add supabase_user_id column to Carts table for anonymous users
ALTER TABLE "Carts" 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_carts_supabase_user_id ON "Carts"(supabase_user_id);

-- =============================================================================
-- STEP 3: UPDATE RLS POLICIES FOR ANONYMOUS AUTH
-- =============================================================================

-- Drop existing cart policies (we'll recreate them)
DROP POLICY IF EXISTS "users_own_cart" ON "Carts";
DROP POLICY IF EXISTS "anonymous_cart_access" ON "Carts";
DROP POLICY IF EXISTS "anonymous_cart_modify" ON "Carts";
DROP POLICY IF EXISTS "anonymous_cart_update" ON "Carts";

-- Create new RLS policies for anonymous auth
-- Anonymous users can access their own cart
CREATE POLICY "anonymous_cart_access" ON "Carts"
    FOR ALL USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = true AND
        supabase_user_id = auth.uid()
    );

-- Permanent users can access their own cart (using userId for backward compatibility)
CREATE POLICY "permanent_user_cart_access" ON "Carts"
    FOR ALL USING (
        (auth.jwt() ->> 'is_anonymous')::boolean = false AND
        (supabase_user_id = auth.uid() OR "userId"::text = auth.uid()::text)
    );

-- Admins can access all carts
CREATE POLICY "admin_cart_access" ON "Carts"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- =============================================================================
-- STEP 4: UPDATE USERS TABLE RLS FOR ANONYMOUS AUTH
-- =============================================================================

-- Drop existing user policies
DROP POLICY IF EXISTS "admin_users_all" ON "Users";
DROP POLICY IF EXISTS "users_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_update_own" ON "Users";
DROP POLICY IF EXISTS "admin_role_changes" ON "Users";

-- Create new user policies for anonymous auth
-- Admins can see all users
CREATE POLICY "admin_users_all" ON "Users"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can see their own profile (by supabase_user_id or email)
CREATE POLICY "users_own_profile" ON "Users"
    FOR SELECT USING (
        supabase_user_id = auth.uid() OR
        email = auth.email() OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON "Users"
    FOR UPDATE USING (
        supabase_user_id = auth.uid() OR
        email = auth.email()
    ) WITH CHECK (
        supabase_user_id = auth.uid() OR
        email = auth.email()
    );

-- Allow insertion for new users (anonymous or permanent)
CREATE POLICY "users_insert" ON "Users"
    FOR INSERT WITH CHECK (
        supabase_user_id = auth.uid() OR
        email = auth.email() OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- =============================================================================
-- STEP 5: UPDATE ORDERS TABLE RLS FOR ANONYMOUS AUTH
-- =============================================================================

-- Drop existing order policies
DROP POLICY IF EXISTS "users_own_orders" ON "Orders";
DROP POLICY IF EXISTS "admin_orders_all" ON "Orders";

-- Create new order policies for anonymous auth
-- Users can access their own orders
CREATE POLICY "users_own_orders" ON "Orders"
    FOR ALL USING (
        supabase_user_id = auth.uid() OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Allow insertion for new orders
CREATE POLICY "users_insert_orders" ON "Orders"
    FOR INSERT WITH CHECK (
        supabase_user_id = auth.uid() OR
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- =============================================================================
-- STEP 6: VERIFICATION QUERIES
-- =============================================================================

-- Check if anonymous auth is enabled
SELECT 
    'Anonymous Auth Status' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.config 
            WHERE key = 'enable_anonymous_sign_ins' AND value = 'true'
        )
        THEN '✅ ENABLED' 
        ELSE '❌ DISABLED - Enable in Supabase Dashboard' 
    END as status;

-- Check RLS policies
SELECT 
    'RLS Policies Count' as check_name,
    COUNT(*) || ' policies found' as status
FROM pg_policies 
WHERE tablename IN ('Users', 'Carts', 'Orders');

-- Check Carts table structure
SELECT 
    'Carts Table Structure' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Carts' AND column_name = 'supabase_user_id'
        )
        THEN '✅ supabase_user_id column exists' 
        ELSE '❌ supabase_user_id column missing' 
    END as status;

-- =============================================================================
-- STEP 7: MIGRATION HELPER FUNCTIONS
-- =============================================================================

-- Function to link anonymous cart to permanent user
CREATE OR REPLACE FUNCTION link_anonymous_cart(
    anonymous_user_id UUID,
    permanent_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update cart to link to permanent user
    UPDATE "Carts" 
    SET supabase_user_id = permanent_user_id
    WHERE supabase_user_id = anonymous_user_id;
    
    -- Update user record
    UPDATE "Users" 
    SET supabase_user_id = permanent_user_id,
        converted_from_anonymous = true
    WHERE supabase_user_id = anonymous_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to merge anonymous cart with permanent user cart
CREATE OR REPLACE FUNCTION merge_anonymous_cart(
    anonymous_user_id UUID,
    permanent_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    anonymous_cart JSONB;
    permanent_cart JSONB;
    merged_cart JSONB;
BEGIN
    -- Get anonymous cart
    SELECT items INTO anonymous_cart 
    FROM "Carts" 
    WHERE supabase_user_id = anonymous_user_id;
    
    -- Get permanent user cart
    SELECT items INTO permanent_cart 
    FROM "Carts" 
    WHERE supabase_user_id = permanent_user_id;
    
    -- Merge carts (simplified merge logic)
    IF anonymous_cart IS NOT NULL AND permanent_cart IS NOT NULL THEN
        -- Merge logic would go here
        merged_cart = permanent_cart || anonymous_cart;
    ELSIF anonymous_cart IS NOT NULL THEN
        merged_cart = anonymous_cart;
    ELSE
        merged_cart = permanent_cart;
    END IF;
    
    -- Update permanent user cart
    UPDATE "Carts" 
    SET items = merged_cart
    WHERE supabase_user_id = permanent_user_id;
    
    -- Delete anonymous cart
    DELETE FROM "Carts" 
    WHERE supabase_user_id = anonymous_user_id;
    
    -- Update user record
    UPDATE "Users" 
    SET supabase_user_id = permanent_user_id,
        converted_from_anonymous = true
    WHERE supabase_user_id = anonymous_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
SELECT '✅ Anonymous Auth Setup Complete!' as status;
SELECT 'Next Steps:' as info;
SELECT '1. Enable anonymous auth in Supabase Dashboard' as step;
SELECT '2. Update frontend to use signInAnonymously()' as step;
SELECT '3. Implement linkIdentity() for Google login' as step; 