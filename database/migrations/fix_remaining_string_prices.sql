-- Fix Remaining String Prices in Cart Items
-- Author: Justin Linzan
-- Date: January 2025

-- Function to fix remaining string prices
CREATE OR REPLACE FUNCTION fix_remaining_string_prices() RETURNS void AS $$
DECLARE
    cart_record RECORD;
    updated_items JSONB;
    item JSONB;
    fixed_item JSONB;
    i INTEGER;
BEGIN
    -- Loop through all carts with string prices
    FOR cart_record IN 
        SELECT id, items 
        FROM "Carts" 
        WHERE items IS NOT NULL 
        AND jsonb_array_length(items) > 0
        AND EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(items) AS item 
            WHERE item->>'price' ~ '^[^0-9]*$' OR item->>'price' = '0'
        )
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
                    WHEN item->>'price' = '0' THEN 0
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
            "updatedAt" = NOW()
        WHERE id = cart_record.id;
        
        RAISE NOTICE 'Fixed cart ID %: % items processed', cart_record.id, jsonb_array_length(updated_items);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the fix
SELECT fix_remaining_string_prices();

-- Verify the fix
SELECT 
    'String Prices Fixed' as check_name,
    COUNT(*) || ' carts with string prices remaining' as status
FROM "Carts" c,
     jsonb_array_elements(c.items) AS item
WHERE item->>'price' ~ '^[^0-9]*$' OR item->>'price' = '0';

-- Show sample of fixed items
SELECT 
    'Sample Fixed Items' as check_name,
    jsonb_pretty(items) as sample_items
FROM "Carts" 
WHERE items IS NOT NULL 
AND jsonb_array_length(items) > 0
LIMIT 2; 