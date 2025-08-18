-- 🎯 PHASE 2: OPTIMIZED DATA MIGRATION - CAMELCASE UNIFIED (BATCH PROCESSING)
-- This script standardizes ALL allergen data to camelCase format across ALL EXISTING tables
-- Uses batch processing to avoid timeouts with large datasets
-- CREATED: 2024-12-19
-- UPDATED: 2024-12-19 - Optimized for large datasets with batch processing

-- 🎯 STEP 1: Create comprehensive standardized allergen mapping functions (CAMELCASE)
-- 🚨 CRITICAL: Removed dangerous mappings like 'nut free' -> 'treeNuts' (these indicate safety, not allergens)

-- Function for array standardization
CREATE OR REPLACE FUNCTION standardize_allergen_array(allergen_array TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    standardized_allergens TEXT[] := ARRAY[]::TEXT[];
    allergen TEXT;
    standardized_allergen TEXT;
BEGIN
    -- If array is null or empty, return empty array
    IF allergen_array IS NULL OR array_length(allergen_array, 1) IS NULL THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    -- Standardize each allergen in the array to camelCase
    FOREACH allergen IN ARRAY allergen_array
    LOOP
        -- Map to standardized camelCase format
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
            ELSE LOWER(allergen) -- Default to lowercase for consistency
        END;
        
        -- Add to standardized array if not already present
        IF NOT (standardized_allergen = ANY(standardized_allergens)) THEN
            standardized_allergens := array_append(standardized_allergens, standardized_allergen);
        END IF;
    END LOOP;
    
    RETURN standardized_allergens;
END;
$$ LANGUAGE plpgsql;

-- Function for single allergen standardization
CREATE OR REPLACE FUNCTION standardize_single_allergen(allergen_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE LOWER(allergen_text)
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
        ELSE LOWER(allergen_text)
    END;
END;
$$ LANGUAGE plpgsql;

-- 🎯 STEP 2: Check current data counts (for batch planning)
SELECT 
    'Data counts for batch planning' as info,
    COUNT(*) as total_ingredientcategorized,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as with_allergens_ingredientcategorized
FROM "IngredientCategorized";

SELECT 
    COUNT(*) as total_ingredients,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as with_allergens_ingredients
FROM "Ingredients";

SELECT 
    COUNT(*) as total_allergenderivatives
FROM "AllergenDerivatives";

SELECT 
    COUNT(*) as total_searchpreferences,
    COUNT(CASE WHEN selected_allergens IS NOT NULL THEN 1 END) as with_allergens_searchpreferences
FROM "SearchPreferences";

-- 🎯 STEP 3: Update IngredientCategorized table (BATCH PROCESSING)
-- Process in batches of 1000 to avoid timeouts
DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_updated INTEGER := 0;
    batch_updated INTEGER;
    offset_val INTEGER := 0;
BEGIN
    LOOP
        -- Update batch
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
        
        -- Exit if no more rows to update
        IF batch_updated = 0 THEN
            EXIT;
        END IF;
        
        total_updated := total_updated + batch_updated;
        offset_val := offset_val + batch_size;
        
        -- Log progress
        RAISE NOTICE 'Updated % rows in IngredientCategorized (total: %)', batch_updated, total_updated;
        
        -- Small delay to prevent overwhelming the database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Completed IngredientCategorized migration. Total updated: %', total_updated;
END $$;

-- 🎯 STEP 4: Update Ingredients table (BATCH PROCESSING)
DO $$
DECLARE
    batch_size INTEGER := 1000;
    total_updated INTEGER := 0;
    batch_updated INTEGER;
    offset_val INTEGER := 0;
BEGIN
    LOOP
        -- Update batch
        UPDATE "Ingredients" 
        SET allergens = standardize_allergen_array(allergens)
        WHERE id IN (
            SELECT id FROM "Ingredients" 
            WHERE allergens IS NOT NULL 
            AND array_length(allergens, 1) > 0
            ORDER BY id
            LIMIT batch_size OFFSET offset_val
        );
        
        GET DIAGNOSTICS batch_updated = ROW_COUNT;
        
        -- Exit if no more rows to update
        IF batch_updated = 0 THEN
            EXIT;
        END IF;
        
        total_updated := total_updated + batch_updated;
        offset_val := offset_val + batch_size;
        
        -- Log progress
        RAISE NOTICE 'Updated % rows in Ingredients (total: %)', batch_updated, total_updated;
        
        -- Small delay to prevent overwhelming the database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Completed Ingredients migration. Total updated: %', total_updated;
END $$;

-- 🎯 STEP 5: Update SearchPreferences table (RENAME COLUMN + BATCH PROCESSING)
-- First, rename the column from snake_case to camelCase
ALTER TABLE "SearchPreferences" 
RENAME COLUMN selected_allergens TO selectedAllergens;

-- Then update the data in batches
DO $$
DECLARE
    batch_size INTEGER := 100;
    total_updated INTEGER := 0;
    batch_updated INTEGER;
    offset_val INTEGER := 0;
BEGIN
    LOOP
        -- Update batch
        UPDATE "SearchPreferences" 
        SET selectedAllergens = standardize_allergen_array(selectedAllergens::TEXT[])
        WHERE id IN (
            SELECT id FROM "SearchPreferences" 
            WHERE selectedAllergens IS NOT NULL 
            AND selectedAllergens != '[]'::jsonb
            ORDER BY id
            LIMIT batch_size OFFSET offset_val
        );
        
        GET DIAGNOSTICS batch_updated = ROW_COUNT;
        
        -- Exit if no more rows to update
        IF batch_updated = 0 THEN
            EXIT;
        END IF;
        
        total_updated := total_updated + batch_updated;
        offset_val := offset_val + batch_size;
        
        -- Log progress
        RAISE NOTICE 'Updated % rows in SearchPreferences (total: %)', batch_updated, total_updated;
        
        -- Small delay to prevent overwhelming the database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Completed SearchPreferences migration. Total updated: %', total_updated;
END $$;

-- 🎯 STEP 6: Update AllergenDerivatives table (SIMPLE UPDATE - small table)
UPDATE "AllergenDerivatives" 
SET allergen = standardize_single_allergen(allergen),
    derivative = standardize_single_allergen(derivative)
WHERE allergen IS NOT NULL OR derivative IS NOT NULL;

-- 🎯 STEP 7: Verification queries (with limits to avoid timeouts)
SELECT 
    'Migration verification - IngredientCategorized' as info,
    COUNT(*) as total_products,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as products_with_allergens
FROM "IngredientCategorized";

SELECT 
    'Migration verification - Ingredients' as info,
    COUNT(*) as total_ingredients,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as ingredients_with_allergens
FROM "Ingredients";

SELECT 
    'Migration verification - AllergenDerivatives' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN allergen IS NOT NULL THEN 1 END) as records_with_allergens
FROM "AllergenDerivatives";

SELECT 
    'Migration verification - SearchPreferences' as info,
    COUNT(*) as total_preferences,
    COUNT(CASE WHEN selectedAllergens IS NOT NULL AND selectedAllergens != '[]'::jsonb THEN 1 END) as preferences_with_allergens
FROM "SearchPreferences";

-- 🎯 STEP 8: Sample verification (limited to avoid timeouts)
SELECT 
    'Sample verification - IngredientCategorized' as info,
    id,
    LEFT(description, 50) as sample_description,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
LIMIT 3;

SELECT 
    'Sample verification - Ingredients' as info,
    id,
    name,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM "Ingredients" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
LIMIT 3;

-- 🎯 STEP 9: Clean up functions
DROP FUNCTION IF EXISTS standardize_allergen_array(TEXT[]);
DROP FUNCTION IF EXISTS standardize_single_allergen(TEXT);

-- 🎯 STEP 10: Final summary
SELECT 
    'MIGRATION COMPLETE - CAMELCASE UNIFIED (OPTIMIZED BATCH PROCESSING)' as status,
    'All allergen data has been standardized to camelCase format' as message,
    'Database columns renamed to camelCase: selectedAllergens' as column_changes,
    'Allergen values standardized to camelCase: milk, treeNuts, peanuts, etc.' as value_changes,
    '🚨 CRITICAL: Removed dangerous safety phrase mappings (nut free, etc.)' as safety_note,
    'Tables processed: IngredientCategorized, Ingredients, SearchPreferences, AllergenDerivatives' as tables_processed,
    'Processing method: Batch processing to avoid timeouts' as processing_method,
    'Next steps: Update API endpoints, clear localStorage cache, reset Redux state' as next_actions; 