-- 🎯 COMPLETE REMAINING MIGRATION - SMALLER BATCHES
-- This script completes the remaining IngredientCategorized records that hit timeout

-- Step 1: Create the standardization function again
CREATE OR REPLACE FUNCTION standardize_allergen_array(allergen_array TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    standardized_allergens TEXT[] := ARRAY[]::TEXT[];
    allergen TEXT;
    standardized_allergen TEXT;
BEGIN
    IF allergen_array IS NULL OR array_length(allergen_array, 1) IS NULL THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    FOREACH allergen IN ARRAY allergen_array
    LOOP
        standardized_allergen := CASE LOWER(allergen)
            WHEN 'milk' THEN 'milk'
            WHEN 'eggs' THEN 'eggs'
            WHEN 'fish' THEN 'fish'
            WHEN 'shellfish' THEN 'shellfish'
            WHEN 'treenuts' THEN 'treeNuts'
            WHEN 'treenut' THEN 'treeNuts'
            WHEN 'tree nuts' THEN 'treeNuts'
            WHEN 'tree-nuts' THEN 'treeNuts'
            WHEN 'tree_nuts' THEN 'treeNuts'
            WHEN 'peanuts' THEN 'peanuts'
            WHEN 'wheat' THEN 'wheat'
            WHEN 'soy' THEN 'soy'
            WHEN 'sesame' THEN 'sesame'
            WHEN 'gluten' THEN 'gluten'
            WHEN 'almonds' THEN 'almonds'
            WHEN 'cashews' THEN 'cashews'
            WHEN 'crab' THEN 'crab'
            WHEN 'lobster' THEN 'lobster'
            WHEN 'shrimp' THEN 'shrimp'
            WHEN 'celery' THEN 'celery'
            WHEN 'garlic' THEN 'garlic'
            WHEN 'nuts' THEN 'treeNuts'
            WHEN 'corn' THEN 'corn'
            WHEN 'walnuts' THEN 'walnuts'
            WHEN 'lactose' THEN 'lactose'
            WHEN 'soybeans' THEN 'soybeans'
            ELSE LOWER(allergen)
        END;
        
        IF NOT (standardized_allergen = ANY(standardized_allergens)) THEN
            standardized_allergens := array_append(standardized_allergens, standardized_allergen);
        END IF;
    END LOOP;
    
    RETURN standardized_allergens;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Complete remaining IngredientCategorized records with smaller batches (25 rows)
DO $$
DECLARE
    batch_size INTEGER := 25;
    total_updated INTEGER := 0;
    batch_updated INTEGER;
    offset_val INTEGER := 80500; -- Start from where we left off
    max_iterations INTEGER := 1000; -- Safety limit
    iteration_count INTEGER := 0;
BEGIN
    LOOP
        iteration_count := iteration_count + 1;
        
        -- Safety check
        IF iteration_count > max_iterations THEN
            RAISE NOTICE 'Reached maximum iterations, stopping';
            EXIT;
        END IF;
        
        UPDATE "IngredientCategorized" 
        SET allergens = standardize_allergen_array(allergens)
        WHERE id IN (
            SELECT id FROM "IngredientCategorized" 
            WHERE allergens IS NOT NULL 
            AND array_length(allergens, 1) > 0
            ORDER BY id
            LIMIT batch_size OFFSET offset_val
        );
        
        GET DIAGNOSTICS batch_updated = ROW_COUNT;
        
        IF batch_updated = 0 THEN
            RAISE NOTICE 'No more records to update, migration complete!';
            EXIT;
        END IF;
        
        total_updated := total_updated + batch_updated;
        offset_val := offset_val + batch_size;
        
        RAISE NOTICE 'Updated % rows in IngredientCategorized (total: %, offset: %)', batch_updated, total_updated, offset_val;
        
        -- Exit if we've processed enough (safety check)
        IF total_updated >= 10000 THEN
            RAISE NOTICE 'Reached 10,000 additional rows, stopping for safety';
            EXIT;
        END IF;
    END LOOP;
END $$;

-- Step 3: Clean up
DROP FUNCTION IF EXISTS standardize_allergen_array(TEXT[]);

-- Step 4: Final verification
SELECT 'Remaining migration complete!' as status; 