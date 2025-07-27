-- Simple Price Fix
-- Convert string prices to numeric

CREATE OR REPLACE FUNCTION fix_string_prices_simple() RETURNS void AS $$
DECLARE
    cart_record RECORD;
    updated_items JSONB;
    item JSONB;
    fixed_item JSONB;
    i INTEGER;
BEGIN
    FOR cart_record IN SELECT id, items FROM "Carts" WHERE items IS NOT NULL AND jsonb_array_length(items) > 0
    LOOP
        updated_items := '[]'::jsonb;
        
        FOR i IN 0..jsonb_array_length(cart_record.items) - 1
        LOOP
            item := cart_record.items->i;
            
            -- Convert string price to numeric
            IF item->>'price' = '"0"' OR item->>'price' = '0' THEN
                fixed_item := jsonb_set(item, '{price}', '0'::jsonb);
            ELSE
                fixed_item := item;
            END IF;
            
            updated_items := updated_items || fixed_item;
        END LOOP;
        
        UPDATE "Carts" SET items = updated_items WHERE id = cart_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT fix_string_prices_simple();

-- Check results
SELECT 
    'Price Fix Results' as check_name,
    COUNT(*) || ' items with string prices remaining' as status
FROM "Carts" c,
     jsonb_array_elements(c.items) AS item
WHERE item->>'price' = '"0"' OR item->>'price' = '0'; 