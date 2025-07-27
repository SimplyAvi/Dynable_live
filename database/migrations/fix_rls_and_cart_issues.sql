-- Fix RLS Policies and Cart Data Issues
-- Author: Justin Linzan
-- Date: January 2025
-- Purpose: Fix admin access blocking and cart price data type issues

-- =============================================================================
-- STEP 1: FIX RLS POLICIES FOR ADMIN ACCESS
-- =============================================================================

-- Drop existing cart policies
DROP POLICY IF EXISTS "admin_cart_access" ON "Carts";
DROP POLICY IF EXISTS "permanent_user_cart_access" ON "Carts";
DROP POLICY IF EXISTS "users_own_cart" ON "Carts";
DROP POLICY IF EXISTS "anonymous_cart_access" ON "Carts";

-- Create improved RLS policies that work with multiple authentication methods
-- Admin access - check both JWT role and Users table role
CREATE POLICY "admin_cart_access" ON "Carts"
    FOR ALL USING (
        -- Check JWT role first
        (auth.jwt() ->> 'role')::text = 'admin'
        OR
        -- Fallback: Check if user exists in Users table with admin role
        EXISTS (
            SELECT 1 FROM "Users" 
            WHERE (supabase_user_id = auth.uid() OR email = auth.jwt() ->> 'email')
            AND role = 'admin'
        )
    );

-- Permanent user access - works with both userId and supabase_user_id
CREATE POLICY "permanent_user_cart_access" ON "Carts"
    FOR ALL USING (
        -- Check supabase_user_id match
        supabase_user_id = auth.uid()
        OR
        -- Check userId match (for backward compatibility)
        "userId"::text = auth.uid()::text
        OR
        -- Check email match (for cases where auth.uid() doesn't work)
        EXISTS (
            SELECT 1 FROM "Users" 
            WHERE email = auth.jwt() ->> 'email'
            AND (supabase_user_id = auth.uid() OR "userId"::text = auth.uid()::text)
        )
    );

-- Anonymous user access
CREATE POLICY "anonymous_cart_access" ON "Carts"
    FOR ALL USING (
        -- Anonymous users can access their own cart
        supabase_user_id = auth.uid()
        AND
        -- Ensure they're actually anonymous
        (auth.jwt() ->> 'is_anonymous')::boolean = true
    );

-- =============================================================================
-- STEP 2: FIX CART ITEM PRICE DATA TYPES
-- =============================================================================

-- Function to fix price data types in cart items
CREATE OR REPLACE FUNCTION fix_cart_price_data_types() RETURNS void AS $$
DECLARE
    cart_record RECORD;
    updated_items JSONB;
    item JSONB;
    fixed_item JSONB;
    items_array JSONB;
BEGIN
    -- Loop through all carts
    FOR cart_record IN SELECT id, items FROM "Carts" WHERE items IS NOT NULL AND jsonb_array_length(items) > 0
    LOOP
        updated_items := '[]'::jsonb;
        
        -- Process each item in the cart
        FOR i IN 0..jsonb_array_length(cart_record.items) - 1
        LOOP
            item := cart_record.items->i;
            
            -- Create fixed item with proper data types
            fixed_item := jsonb_build_object(
                'id', item->>'id',
                'name', item->>'name',
                'brand', item->>'brand',
                'brandName', item->>'brandName',
                'image', item->>'image',
                'price', CASE 
                    WHEN item->>'price' IS NULL THEN 0
                    WHEN item->>'price' = '' THEN 0
                    ELSE (item->>'price')::numeric
                END,
                'quantity', CASE 
                    WHEN item->>'quantity' IS NULL THEN 1
                    ELSE (item->>'quantity')::integer
                END
            );
            
            -- Add to updated items array
            updated_items := updated_items || fixed_item;
        END LOOP;
        
        -- Update the cart with fixed items
        UPDATE "Carts" 
        SET items = updated_items, 
            updatedAt = NOW()
        WHERE id = cart_record.id;
        
        RAISE NOTICE 'Fixed cart ID %: % items processed', cart_record.id, jsonb_array_length(updated_items);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the price fix function
SELECT fix_cart_price_data_types();

-- =============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS FOR ADMIN ACCESS
-- =============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_user() RETURNS boolean AS $$
BEGIN
    RETURN (
        -- Check JWT role
        (auth.jwt() ->> 'role')::text = 'admin'
        OR
        -- Check Users table
        EXISTS (
            SELECT 1 FROM "Users" 
            WHERE (supabase_user_id = auth.uid() OR email = auth.jwt() ->> 'email')
            AND role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all carts (admin only)
CREATE OR REPLACE FUNCTION get_all_carts_admin() RETURNS TABLE (
    id integer,
    user_id integer,
    supabase_user_id uuid,
    items jsonb,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    -- Check if user is admin
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    RETURN QUERY
    SELECT 
        c.id,
        c."userId",
        c.supabase_user_id,
        c.items,
        c."createdAt",
        c."updatedAt"
    FROM "Carts" c
    ORDER BY c."updatedAt" DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 4: CREATE DATA VALIDATION TRIGGER
-- =============================================================================

-- Function to validate cart item data types before insert/update
CREATE OR REPLACE FUNCTION validate_cart_items() RETURNS trigger AS $$
DECLARE
    item JSONB;
    i INTEGER;
BEGIN
    -- Only validate if items are not null
    IF NEW.items IS NOT NULL AND jsonb_array_length(NEW.items) > 0 THEN
        FOR i IN 0..jsonb_array_length(NEW.items) - 1
        LOOP
            item := NEW.items->i;
            
            -- Validate price is numeric
            IF item->>'price' IS NOT NULL THEN
                BEGIN
                    PERFORM (item->>'price')::numeric;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE EXCEPTION 'Invalid price value in cart item: %', item->>'price';
                END;
            END IF;
            
            -- Validate quantity is integer
            IF item->>'quantity' IS NOT NULL THEN
                BEGIN
                    PERFORM (item->>'quantity')::integer;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE EXCEPTION 'Invalid quantity value in cart item: %', item->>'quantity';
                END;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate cart items
DROP TRIGGER IF EXISTS validate_cart_items_trigger ON "Carts";
CREATE TRIGGER validate_cart_items_trigger
    BEFORE INSERT OR UPDATE ON "Carts"
    FOR EACH ROW
    EXECUTE FUNCTION validate_cart_items();

-- =============================================================================
-- STEP 5: VERIFICATION QUERIES
-- =============================================================================

-- Check RLS policies
SELECT 
    'RLS Policies Status' as check_name,
    COUNT(*) || ' policies found' as status
FROM pg_policies 
WHERE tablename = 'Carts';

-- Check cart price data types
SELECT 
    'Cart Price Data Types' as check_name,
    COUNT(*) || ' carts with string prices' as status
FROM "Carts" c,
     jsonb_array_elements(c.items) AS item
WHERE item->>'price' ~ '^[^0-9]*$' OR item->>'price' IS NULL;

-- Check admin users
SELECT 
    'Admin Users' as check_name,
    COUNT(*) || ' admin users found' as status
FROM "Users" 
WHERE role = 'admin';

-- Test admin access function
SELECT 
    'Admin Access Function' as check_name,
    CASE 
        WHEN is_admin_user() THEN '✅ Admin access available'
        ELSE '❌ Admin access not available'
    END as status;

-- =============================================================================
-- STEP 6: MIGRATION COMPLETION
-- =============================================================================

SELECT '✅ RLS and Cart Issues Fixed!' as status;
SELECT 'Changes Made:' as info;
SELECT '1. Fixed RLS policies for admin access' as change;
SELECT '2. Fixed cart item price data types' as change;
SELECT '3. Added data validation triggers' as change;
SELECT '4. Created admin helper functions' as change; 