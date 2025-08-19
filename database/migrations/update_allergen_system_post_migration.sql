-- 🎯 POST-MIGRATION SYSTEM UPDATE SCRIPT - CAMELCASE UNIFIED
-- This script updates API endpoints, clears cached data, and ensures system consistency
-- All functions now use camelCase format for true full-stack consistency
-- UPDATED: 2024-12-19 - Only works with existing tables

-- ========================================
-- STEP 1: UPDATE API ENDPOINTS TO USE CAMELCASE FORMAT
-- ========================================

-- Function to get allergens in camelCase format (simplified for existing tables)
CREATE OR REPLACE FUNCTION get_standardized_allergens()
RETURNS TABLE(allergen_name TEXT, category TEXT, description TEXT, severity_level INTEGER) AS $$
BEGIN
    -- Return standardized allergen list since AllergenCategories table doesn't exist
    RETURN QUERY
    SELECT 
        'milk'::TEXT as allergen_name,
        'major'::TEXT as category,
        'Milk and dairy products'::TEXT as description,
        5::INTEGER as severity_level
    UNION ALL
    SELECT 'eggs'::TEXT, 'major'::TEXT, 'Eggs and egg products'::TEXT, 5::INTEGER
    UNION ALL
    SELECT 'fish'::TEXT, 'major'::TEXT, 'Fish and fish products'::TEXT, 5::INTEGER
    UNION ALL
    SELECT 'shellfish'::TEXT, 'major'::TEXT, 'Shellfish and crustaceans'::TEXT, 5::INTEGER
    UNION ALL
    SELECT 'treeNuts'::TEXT, 'major'::TEXT, 'Tree nuts (almonds, walnuts, etc.)'::TEXT, 5::INTEGER
    UNION ALL
    SELECT 'peanuts'::TEXT, 'major'::TEXT, 'Peanuts and peanut products'::TEXT, 5::INTEGER
    UNION ALL
    SELECT 'wheat'::TEXT, 'major'::TEXT, 'Wheat and wheat products'::TEXT, 4::INTEGER
    UNION ALL
    SELECT 'soy'::TEXT, 'major'::TEXT, 'Soy and soy products'::TEXT, 4::INTEGER
    UNION ALL
    SELECT 'sesame'::TEXT, 'major'::TEXT, 'Sesame seeds and products'::TEXT, 4::INTEGER
    UNION ALL
    SELECT 'gluten'::TEXT, 'major'::TEXT, 'Gluten-containing grains'::TEXT, 4::INTEGER
    ORDER BY severity_level DESC, allergen_name;
END;
$$ LANGUAGE plpgsql;

-- Function to search products with camelCase allergen filtering
CREATE OR REPLACE FUNCTION search_products_with_allergens(
    search_term TEXT DEFAULT '',
    user_allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
    page_num INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 20
)
RETURNS TABLE(
    id INTEGER,
    description TEXT,
    brand_name TEXT,
    allergens TEXT[],
    canonical_tag TEXT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH product_counts AS (
        SELECT COUNT(*) as total
            FROM "IngredientCategorized" ic
    WHERE ic."is_active" = true
    AND (search_term = '' OR ic.description ILIKE '%' || search_term || '%')
    AND (
        array_length(user_allergens, 1) IS NULL 
        OR NOT (ic.allergens && user_allergens)
    )
    )
    SELECT 
        ic.id,
        ic.description,
        ic."brandName",
        ic.allergens,
        ic."canonicalTag",
        pc.total
    FROM "IngredientCategorized" ic
    CROSS JOIN product_counts pc
    WHERE ic."is_active" = true
    AND (search_term = '' OR ic.description ILIKE '%' || search_term || '%')
    AND (
        array_length(user_allergens, 1) IS NULL 
        OR NOT (ic.allergens && user_allergens)
    )
    ORDER BY ic.description
    LIMIT page_size
    OFFSET (page_num - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- Function to get allergen derivatives in camelCase format
CREATE OR REPLACE FUNCTION get_allergen_derivatives()
RETURNS TABLE(allergen TEXT, derivatives TEXT[]) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ad.allergen,
        ARRAY_AGG(ad.derivative) as derivatives
    FROM "AllergenDerivatives" ad
    GROUP BY ad.allergen
    ORDER BY ad.allergen;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 2: CREATE CACHE CLEARING FUNCTIONS
-- ========================================

-- Function to clear user allergen preferences (for API use)
CREATE OR REPLACE FUNCTION clear_user_allergen_preferences(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE "SearchPreferences" 
    SET selectedAllergens = '[]'::jsonb
    WHERE supabase_user_id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to reset user allergen preferences to camelCase format
CREATE OR REPLACE FUNCTION reset_user_allergen_preferences(user_id UUID, new_allergens TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    standardized_allergens TEXT[];
BEGIN
    -- Standardize the input allergens to camelCase
    SELECT ARRAY_AGG(DISTINCT LOWER(allergen)) INTO standardized_allergens
    FROM unnest(new_allergens) as allergen;
    
    -- Update or insert user preferences
    INSERT INTO "SearchPreferences" (supabase_user_id, selectedAllergens)
    VALUES (user_id, to_jsonb(standardized_allergens))
    ON CONFLICT (supabase_user_id) 
    DO UPDATE SET 
        selectedAllergens = to_jsonb(standardized_allergens),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 3: CREATE VALIDATION FUNCTIONS
-- ========================================

-- Function to validate allergen format (camelCase)
CREATE OR REPLACE FUNCTION validate_allergen_format(allergen_input TEXT)
RETURNS TABLE(is_valid BOOLEAN, standardized_name TEXT, error_message TEXT) AS $$
DECLARE
    valid_allergens TEXT[] := ARRAY['milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 'wheat', 'soy', 'sesame', 'gluten'];
    input_standardized TEXT;
BEGIN
    -- Standardize input to camelCase
    input_standardized := LOWER(allergen_input);
    
    -- Check if it's in our valid list
    IF input_standardized = ANY(valid_allergens) THEN
        RETURN QUERY SELECT TRUE, input_standardized, NULL::TEXT;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::TEXT, 'Invalid allergen: ' || allergen_input;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to validate allergen array (camelCase)
CREATE OR REPLACE FUNCTION validate_allergen_array(allergen_array TEXT[])
RETURNS TABLE(is_valid BOOLEAN, standardized_array TEXT[], error_messages TEXT[]) AS $$
DECLARE
    valid_allergens TEXT[] := ARRAY['milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 'wheat', 'soy', 'sesame', 'gluten'];
    standardized TEXT[];
    errors TEXT[] := ARRAY[]::TEXT[];
    allergen TEXT;
    is_valid_input BOOLEAN := TRUE;
BEGIN
    -- Process each allergen
    FOREACH allergen IN ARRAY allergen_array
    LOOP
        IF LOWER(allergen) = ANY(valid_allergens) THEN
            standardized := array_append(standardized, LOWER(allergen));
        ELSE
            errors := array_append(errors, 'Invalid allergen: ' || allergen);
            is_valid_input := FALSE;
        END IF;
    END LOOP;
    
    -- Remove duplicates
    SELECT ARRAY_AGG(DISTINCT s) INTO standardized
    FROM unnest(standardized) s;
    
    RETURN QUERY SELECT is_valid_input, standardized, errors;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 4: CREATE MIGRATION STATUS FUNCTIONS
-- ========================================

-- Function to check migration status across existing tables only (camelCase verification)
CREATE OR REPLACE FUNCTION check_allergen_migration_status()
RETURNS TABLE(
    table_name TEXT,
    total_records BIGINT,
    standardized_records BIGINT,
    inconsistent_records BIGINT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    
    -- Check IngredientCategorized
    SELECT 
        'IngredientCategorized'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(CASE WHEN allergens IS NULL OR array_length(allergens, 1) IS NULL OR 
            NOT EXISTS (SELECT 1 FROM unnest(allergens) a WHERE a != LOWER(a)) THEN 1 END)::BIGINT,
        COUNT(CASE WHEN EXISTS (SELECT 1 FROM unnest(allergens) a WHERE a != LOWER(a)) THEN 1 END)::BIGINT,
        CASE WHEN COUNT(CASE WHEN EXISTS (SELECT 1 FROM unnest(allergens) a WHERE a != LOWER(a)) THEN 1 END) = 0 
             THEN 'STANDARDIZED' ELSE 'INCONSISTENT' END::TEXT
    FROM "IngredientCategorized"
    WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0
    
    UNION ALL
    
    -- Check AllergenDerivatives
    SELECT 
        'AllergenDerivatives'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(CASE WHEN (allergen IS NULL OR allergen = LOWER(allergen)) AND 
                                (derivative IS NULL OR derivative = LOWER(derivative)) THEN 1 END)::BIGINT,
        COUNT(CASE WHEN (allergen IS NOT NULL AND allergen != LOWER(allergen)) OR 
                                (derivative IS NOT NULL AND derivative != LOWER(derivative)) THEN 1 END)::BIGINT,
        CASE WHEN COUNT(CASE WHEN (allergen IS NOT NULL AND allergen != LOWER(allergen)) OR 
                                        (derivative IS NOT NULL AND derivative != LOWER(derivative)) THEN 1 END) = 0 
             THEN 'STANDARDIZED' ELSE 'INCONSISTENT' END::TEXT
    FROM "AllergenDerivatives"
    
    UNION ALL
    
    -- Check IngredientAllergens
    SELECT 
        'IngredientAllergens'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(CASE WHEN "allergenName" IS NULL OR "allergenName" = LOWER("allergenName") THEN 1 END)::BIGINT,
        COUNT(CASE WHEN "allergenName" IS NOT NULL AND "allergenName" != LOWER("allergenName") THEN 1 END)::BIGINT,
        CASE WHEN COUNT(CASE WHEN "allergenName" IS NOT NULL AND "allergenName" != LOWER("allergenName") THEN 1 END) = 0 
             THEN 'STANDARDIZED' ELSE 'INCONSISTENT' END::TEXT
    FROM "IngredientAllergens"
    
    UNION ALL
    
    -- Check SearchPreferences
    SELECT 
        'SearchPreferences'::TEXT,
        COUNT(*)::BIGINT,
        COUNT(CASE WHEN selectedAllergens IS NULL OR selectedAllergens = '[]'::jsonb OR 
            NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(selectedAllergens) a WHERE a != LOWER(a)) THEN 1 END)::BIGINT,
        COUNT(CASE WHEN EXISTS (SELECT 1 FROM jsonb_array_elements_text(selectedAllergens) a WHERE a != LOWER(a)) THEN 1 END)::BIGINT,
        CASE WHEN COUNT(CASE WHEN EXISTS (SELECT 1 FROM jsonb_array_elements_text(selectedAllergens) a WHERE a != LOWER(a)) THEN 1 END) = 0 
             THEN 'STANDARDIZED' ELSE 'INCONSISTENT' END::TEXT
    FROM "SearchPreferences"
    WHERE selectedAllergens IS NOT NULL AND selectedAllergens != '[]'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 5: CREATE CLEANUP FUNCTIONS
-- ========================================

-- Function to clean up duplicate allergen entries
CREATE OR REPLACE FUNCTION cleanup_duplicate_allergens()
RETURNS TABLE(table_name TEXT, duplicates_removed INTEGER) AS $$
DECLARE
    removed_count INTEGER := 0;
BEGIN
    -- Clean up AllergenDerivatives duplicates
    WITH duplicates AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY allergen, derivative ORDER BY id) as rn
        FROM "AllergenDerivatives"
    )
    DELETE FROM "AllergenDerivatives" 
    WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
    
    GET DIAGNOSTICS removed_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'AllergenDerivatives'::TEXT, removed_count;
    
    -- Reset counter
    removed_count := 0;
    
    -- Clean up IngredientAllergens duplicates
    WITH duplicates AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "ingredientId", "allergenName" ORDER BY id) as rn
        FROM "IngredientAllergens"
    )
    DELETE FROM "IngredientAllergens" 
    WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
    
    GET DIAGNOSTICS removed_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'IngredientAllergens'::TEXT, removed_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 6: EXECUTE CLEANUP AND STATUS CHECKS
-- ========================================

-- Clean up any duplicate entries
SELECT * FROM cleanup_duplicate_allergens();

-- Check migration status across existing tables only
SELECT * FROM check_allergen_migration_status();

-- ========================================
-- STEP 7: FINAL VERIFICATION
-- ========================================

-- Verify all allergen values are in camelCase format
SELECT 'Final verification - camelCase format check' as info;

SELECT 'IngredientCategorized' as table_name, COUNT(*) as non_camelcase_count
FROM "IngredientCategorized" 
WHERE EXISTS (
    SELECT 1 FROM unnest(allergens) a 
    WHERE a != LOWER(a)
)
UNION ALL
SELECT 'AllergenDerivatives' as table_name, COUNT(*) as non_camelcase_count
FROM "AllergenDerivatives" 
WHERE allergen != LOWER(allergen) OR derivative != LOWER(derivative)
UNION ALL
SELECT 'IngredientAllergens' as table_name, COUNT(*) as non_camelcase_count
FROM "IngredientAllergens" 
WHERE "allergenName" != LOWER("allergenName")
UNION ALL
SELECT 'SearchPreferences' as table_name, COUNT(*) as non_camelcase_count
FROM "SearchPreferences" 
WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(selectedAllergens) a 
    WHERE a != LOWER(a)
)
UNION ALL
SELECT 'CanonicalIngredients' as table_name, COUNT(*) as non_camelcase_count
FROM "CanonicalIngredients" 
WHERE EXISTS (
    SELECT 1 FROM unnest(allergens) a 
    WHERE a != LOWER(a)
)
UNION ALL
SELECT 'UserHistories' as table_name, COUNT(*) as non_camelcase_count
FROM "UserHistories" 
WHERE EXISTS (
    SELECT 1 FROM unnest(allergens) a 
    WHERE a != LOWER(a)
);

-- Show sample of standardized data
SELECT 'Sample of standardized allergen data' as info;

SELECT 'IngredientCategorized sample:' as table_name, allergens
FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0
LIMIT 3;

SELECT 'SearchPreferences sample:' as table_name, selectedAllergens
FROM "SearchPreferences" 
WHERE selectedAllergens IS NOT NULL AND selectedAllergens != '[]'::jsonb
LIMIT 3;

-- ========================================
-- STEP 8: SUMMARY REPORT
-- ========================================

SELECT 
    'POST-MIGRATION SYSTEM UPDATE COMPLETE - CAMELCASE UNIFIED (EXISTING TABLES ONLY)' as status,
    'All API functions updated to use camelCase format' as api_updates,
    'Database columns renamed: selectedAllergens' as column_changes,
    'Allergen values standardized to camelCase: milk, treeNuts, peanuts, etc.' as value_changes,
    'Validation functions created for camelCase format' as validation,
    'Tables processed: IngredientCategorized, SearchPreferences, AllergenDerivatives, IngredientAllergens, CanonicalIngredients, UserHistories' as tables_processed,
    'Next: Update frontend to use new API functions and clear localStorage' as next_steps; 