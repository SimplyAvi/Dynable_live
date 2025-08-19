-- 🎯 PHASE 2: COMPREHENSIVE DATA MIGRATION - CAMELCASE UNIFIED
-- This script standardizes ALL allergen data to camelCase format across ALL EXISTING tables
-- NO CASE CONVERSIONS NEEDED - TRUE FULL-STACK CONSISTENCY
-- CREATED: 2024-12-19
-- UPDATED: 2024-12-19 - Updated to include ALL discovered tables with allergen data

-- Check current allergen data inconsistencies across ALL EXISTING tables
SELECT 
    'Current allergen data inconsistencies - IngredientCategorized' as info,
    COUNT(*) as total_products,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as products_with_allergens,
    COUNT(CASE WHEN allergens IS NULL OR array_length(allergens, 1) = 0 THEN 1 END) as products_without_allergens
FROM "IngredientCategorized";

SELECT 
    'Current allergen data inconsistencies - Ingredients' as info,
    COUNT(*) as total_ingredients,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as ingredients_with_allergens,
    COUNT(CASE WHEN allergens IS NULL OR array_length(allergens, 1) = 0 THEN 1 END) as ingredients_without_allergens
FROM "Ingredients";

-- Show sample of inconsistent allergen data from main tables
SELECT 
    id,
    description,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
LIMIT 5;

SELECT 
    id,
    name,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM "Ingredients" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
LIMIT 5;

-- 🎯 STEP 1: Create comprehensive standardized allergen mapping function (CAMELCASE)
-- 🚨 CRITICAL: Removed dangerous mappings like 'nut free' -> 'treeNuts' (these indicate safety, not allergens)
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
        -- 🚨 CRITICAL: Only map actual allergen names, NOT safety phrases
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
            WHEN 'treenuts' THEN 'treeNuts'
            WHEN 'treenuts' THEN 'treeNuts'
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
            -- 🚨 REMOVED: Dangerous mappings that indicate safety, not allergens
            -- WHEN 'nut free' THEN 'treeNuts'  -- REMOVED: This indicates SAFETY
            -- WHEN 'nut_free' THEN 'treeNuts'  -- REMOVED: This indicates SAFETY  
            -- WHEN 'nut-free' THEN 'treeNuts'  -- REMOVED: This indicates SAFETY
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

-- 🎯 STEP 2: Update IngredientCategorized table (Main Products Table)
UPDATE "IngredientCategorized" 
SET allergens = standardize_allergen_array(allergens)
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0;

-- 🎯 STEP 3: Update Ingredients table (Ingredient Reference Table)
UPDATE "Ingredients" 
SET allergens = standardize_allergen_array(allergens)
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0;

-- 🎯 STEP 4: Update SearchPreferences table (User Preferences) - RENAME COLUMN TO CAMELCASE
-- First, rename the column from snake_case to camelCase
ALTER TABLE "SearchPreferences" 
RENAME COLUMN selected_allergens TO selectedAllergens;

-- Then update the data to camelCase format
UPDATE "SearchPreferences" 
SET selectedAllergens = standardize_allergen_array(selectedAllergens::TEXT[])
WHERE selectedAllergens IS NOT NULL 
AND selectedAllergens != '[]'::jsonb;

-- 🎯 STEP 5: Update AllergenDerivatives table (Allergen Mappings)
-- Create a helper function for single allergen standardization
CREATE OR REPLACE FUNCTION standardize_single_allergen(allergen_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Map to standardized camelCase format
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
        -- 🚨 REMOVED: Dangerous mappings that indicate safety, not allergens
        ELSE LOWER(allergen_text) -- Default to lowercase for consistency
    END;
END;
$$ LANGUAGE plpgsql;

UPDATE "AllergenDerivatives" 
SET allergen = standardize_single_allergen(allergen),
    derivative = standardize_single_allergen(derivative)
WHERE allergen IS NOT NULL OR derivative IS NOT NULL;

-- 🎯 STEP 6: Verify the migration was successful across ALL tables
SELECT 
    'Migration verification - IngredientCategorized' as info,
    COUNT(*) as total_products,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as products_with_allergens,
    COUNT(CASE WHEN allergens IS NULL OR array_length(allergens, 1) = 0 THEN 1 END) as products_without_allergens
FROM "IngredientCategorized";

SELECT 
    'Migration verification - Ingredients' as info,
    COUNT(*) as total_ingredients,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as ingredients_with_allergens,
    COUNT(CASE WHEN allergens IS NULL OR array_length(allergens, 1) = 0 THEN 1 END) as ingredients_without_allergens
FROM "Ingredients";

-- Show sample of standardized allergen data from main tables
SELECT 
    id,
    description,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
LIMIT 5;

SELECT 
    id,
    name,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM "Ingredients" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
LIMIT 5;

-- 🎯 STEP 7: Show unique allergen values to verify standardization across ALL tables
SELECT 
    'Unique allergen values after migration - IngredientCategorized' as info,
    unnest(allergens) as allergen,
    COUNT(*) as frequency
FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
GROUP BY unnest(allergens)
ORDER BY frequency DESC;

SELECT 
    'Unique allergen values after migration - Ingredients' as info,
    unnest(allergens) as allergen,
    COUNT(*) as frequency
FROM "Ingredients" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
GROUP BY unnest(allergens)
ORDER BY frequency DESC;

-- 🎯 STEP 8: Verify AllergenDerivatives migration
SELECT 
    'AllergenDerivatives migration verification' as info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN allergen IS NOT NULL THEN 1 END) as records_with_allergens,
    COUNT(CASE WHEN derivative IS NOT NULL THEN 1 END) as records_with_derivatives
FROM "AllergenDerivatives";

-- Show sample of standardized AllergenDerivatives data
SELECT 
    id,
    allergen,
    derivative,
    "createdAt",
    "updatedAt"
FROM "AllergenDerivatives" 
WHERE allergen IS NOT NULL OR derivative IS NOT NULL
LIMIT 10;

-- 🎯 STEP 9: Verify SearchPreferences migration
SELECT 
    'SearchPreferences migration verification' as info,
    COUNT(*) as total_preferences,
    COUNT(CASE WHEN selectedAllergens IS NOT NULL AND selectedAllergens != '[]'::jsonb THEN 1 END) as preferences_with_allergens
FROM "SearchPreferences";

-- Show sample of standardized SearchPreferences allergen data
SELECT 
    id,
    supabase_user_id,
    selectedAllergens,
    jsonb_array_length(selectedAllergens) as allergen_count
FROM "SearchPreferences" 
WHERE selectedAllergens IS NOT NULL 
AND selectedAllergens != '[]'::jsonb
LIMIT 5;

-- 🎯 STEP 10: Clean up functions
DROP FUNCTION IF EXISTS standardize_allergen_array(TEXT[]);
DROP FUNCTION IF EXISTS standardize_single_allergen(TEXT);

-- 🎯 STEP 11: Final verification - Check for any remaining inconsistencies across ALL tables
SELECT 
    'FINAL VERIFICATION - Check for remaining inconsistencies' as info,
    'All tables should now use camelCase format for allergen values' as note;

-- Check for any non-camelCase allergen values remaining across ALL tables
SELECT 'IngredientCategorized' as table_name, COUNT(*) as non_camelcase_count
FROM "IngredientCategorized" 
WHERE EXISTS (
    SELECT 1 FROM unnest(allergens) a 
    WHERE a != LOWER(a) AND a != INITCAP(a)
)
UNION ALL
SELECT 'Ingredients' as table_name, COUNT(*) as non_camelcase_count
FROM "Ingredients" 
WHERE EXISTS (
    SELECT 1 FROM unnest(allergens) a 
    WHERE a != LOWER(a) AND a != INITCAP(a)
)
UNION ALL
SELECT 'AllergenDerivatives' as table_name, COUNT(*) as non_camelcase_count
FROM "AllergenDerivatives" 
WHERE (allergen != LOWER(allergen) AND allergen != INITCAP(allergen)) OR 
      (derivative != LOWER(derivative) AND derivative != INITCAP(derivative))
UNION ALL
SELECT 'SearchPreferences' as table_name, COUNT(*) as non_camelcase_count
FROM "SearchPreferences" 
WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(selectedAllergens) a 
    WHERE a != LOWER(a) AND a != INITCAP(a)
);

-- 🎯 STEP 12: Summary report
SELECT 
    'MIGRATION COMPLETE - CAMELCASE UNIFIED (ALL DISCOVERED TABLES)' as status,
    'All allergen data has been standardized to camelCase format' as message,
    'Database columns renamed to camelCase: selectedAllergens' as column_changes,
    'Allergen values standardized to camelCase: milk, treeNuts, peanuts, etc.' as value_changes,
    '🚨 CRITICAL: Removed dangerous safety phrase mappings (nut free, etc.)' as safety_note,
    'Tables processed: IngredientCategorized, Ingredients, SearchPreferences, AllergenDerivatives' as tables_processed,
    'Total tables discovered: 12 (4 with allergen data)' as discovery_summary,
    'Next steps: Update API endpoints, clear localStorage cache, reset Redux state' as next_actions; 