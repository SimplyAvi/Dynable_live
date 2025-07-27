-- Final Comprehensive Price Fix
-- Convert ALL remaining string prices to numeric

CREATE OR REPLACE FUNCTION fix_all_string_prices() RETURNS void AS $$
DECLARE
    cart_record RECORD;
    updated_items JSONB;
    item JSONB;
    fixed_item JSONB;
    i INTEGER;
    price_value TEXT;
    numeric_price NUMERIC;
BEGIN
    FOR cart_record IN SELECT id, items FROM "Carts" WHERE items IS NOT NULL AND jsonb_array_length(items) > 0
    LOOP
        updated_items := '[]'::jsonb;
        
        FOR i IN 0..jsonb_array_length(cart_record.items) - 1
        LOOP
            item := cart_record.items->i;
            price_value := item->>'price';
            
            -- Convert any string price to numeric
            IF price_value IS NOT NULL THEN
                BEGIN
                    numeric_price := price_value::numeric;
                EXCEPTION
                    WHEN OTHERS THEN
                        numeric_price := 0;
                END;
            ELSE
                numeric_price := 0;
            END IF;
            
            -- Create fixed item with numeric price
            fixed_item := jsonb_set(item, '{price}', numeric_price::jsonb);
            updated_items := updated_items || fixed_item;
        END LOOP;
        
        UPDATE "Carts" SET items = updated_items WHERE id = cart_record.id;
        RAISE NOTICE 'Fixed cart ID %: % items processed', cart_record.id, jsonb_array_length(updated_items);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the comprehensive fix
SELECT fix_all_string_prices();

-- Verify the fix
SELECT 
    'Final Price Fix Results' as check_name,
    COUNT(*) || ' items with string prices remaining' as status
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
LIMIT 1; 