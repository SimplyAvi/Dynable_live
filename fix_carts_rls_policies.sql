-- Fix RLS policies for Carts table - MERGE-ENABLED APPROACH
-- Allow cart merge operations while maintaining security

-- Drop all existing policies
DROP POLICY IF EXISTS "anonymous_cart_access" ON "Carts";
DROP POLICY IF EXISTS "anonymous_cart_modify" ON "Carts";
DROP POLICY IF EXISTS "anonymous_cart_update" ON "Carts";
DROP POLICY IF EXISTS "users_own_cart" ON "Carts";
DROP POLICY IF EXISTS "cart_merge_access" ON "Carts";
DROP POLICY IF EXISTS "cart_cleanup" ON "Carts";

-- Create simple unified policy that works for both user types
-- This allows users to access their own carts
CREATE POLICY "users_own_cart" ON "Carts"
    FOR ALL USING (
        "supabase_user_id"::text = auth.uid()::text
    );

-- Drop existing function before recreating with different return type
DROP FUNCTION IF EXISTS merge_carts_safe(UUID, UUID);

-- Create a complete function to handle cart merge with RLS bypass
-- FIXED: Using JSONB instead of JSON for proper array operations
-- FIXED: Using correct column names "createdAt" and "updatedAt"
CREATE OR REPLACE FUNCTION merge_carts_safe(
    anonymous_user_id UUID,
    authenticated_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    anonymous_cart JSONB;
    authenticated_cart JSONB;
    merged_items JSONB;
    anonymous_items JSONB;
    authenticated_items JSONB;
    merged_item JSONB;
    item JSONB;
    existing_item JSONB;
    found_item BOOLEAN;
    result JSONB;
    now TIMESTAMP;
BEGIN
    -- Get current timestamp
    now := NOW();
    
    -- Get anonymous cart (bypass RLS)
    SELECT items INTO anonymous_cart
    FROM "Carts"
    WHERE supabase_user_id = anonymous_user_id;
    
    -- Get authenticated cart (bypass RLS)
    SELECT items INTO authenticated_cart
    FROM "Carts"
    WHERE supabase_user_id = authenticated_user_id;
    
    -- Initialize arrays using JSONB
    anonymous_items := COALESCE(anonymous_cart, '[]'::JSONB);
    authenticated_items := COALESCE(authenticated_cart, '[]'::JSONB);
    merged_items := authenticated_items; -- Start with authenticated cart
    
    -- Merge logic: Process each anonymous item
    FOR i IN 0..jsonb_array_length(anonymous_items) - 1 LOOP
        item := anonymous_items->i;
        found_item := FALSE;
        
        -- Check if item already exists in authenticated cart
        FOR j IN 0..jsonb_array_length(merged_items) - 1 LOOP
            existing_item := merged_items->j;
            
            -- If same item ID, combine quantities
            IF (item->>'id')::INTEGER = (existing_item->>'id')::INTEGER THEN
                -- Combine quantities using JSONB
                merged_item := jsonb_build_object(
                    'id', existing_item->>'id',
                    'name', existing_item->>'name',
                    'brand', existing_item->>'brand',
                    'price', existing_item->>'price',
                    'image', existing_item->>'image',
                    'quantity', COALESCE((existing_item->>'quantity')::INTEGER, 1) + COALESCE((item->>'quantity')::INTEGER, 1)
                );
                
                -- Update the item in merged_items using jsonb_set
                merged_items := jsonb_set(merged_items, ARRAY[j::TEXT], merged_item);
                found_item := TRUE;
                EXIT;
            END IF;
        END LOOP;
        
        -- If item not found, add it to merged cart using JSONB concatenation
        IF NOT found_item THEN
            merged_items := merged_items || item;
        END IF;
    END LOOP;
    
    -- Save merged cart to authenticated user using correct column names
    INSERT INTO "Carts" (supabase_user_id, items, "createdAt", "updatedAt")
    VALUES (authenticated_user_id, merged_items, now, now)
    ON CONFLICT (supabase_user_id) 
    DO UPDATE SET 
        items = EXCLUDED.items,
        "updatedAt" = EXCLUDED."updatedAt";
    
    -- Delete anonymous cart after successful merge
    DELETE FROM "Carts" WHERE supabase_user_id = anonymous_user_id;
    
    -- Return result with merge details using JSONB
    result := jsonb_build_object(
        'success', TRUE,
        'anonymous_items_count', jsonb_array_length(anonymous_items),
        'authenticated_items_count', jsonb_array_length(authenticated_items),
        'merged_items_count', jsonb_array_length(merged_items),
        'anonymous_user_id', anonymous_user_id,
        'authenticated_user_id', authenticated_user_id,
        'merged_items', merged_items,
        'timestamp', now
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information using JSONB
        result := jsonb_build_object(
            'success', FALSE,
            'error', SQLERRM,
            'anonymous_user_id', anonymous_user_id,
            'authenticated_user_id', authenticated_user_id
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION merge_carts_safe(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION merge_carts_safe(UUID, UUID) TO anon;

-- Verify policies are applied
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
WHERE tablename = 'Carts'
ORDER BY policyname; 