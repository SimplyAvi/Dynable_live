-- 🎯 SAFE MIGRATION - HANDLES UNIQUE CONSTRAINTS PROPERLY
-- Process data safely to avoid constraint violations

-- Step 1: Create standardization functions
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

-- Step 2: Rename SearchPreferences column
ALTER TABLE "SearchPreferences" 
RENAME COLUMN selected_allergens TO selectedAllergens;

-- Step 3: Handle AllergenDerivatives safely (create new table approach)
-- Create a temporary table with standardized data
CREATE TEMP TABLE temp_allergen_derivatives AS
SELECT DISTINCT
    standardize_single_allergen(allergen) as allergen,
    standardize_single_allergen(derivative) as derivative,
    MIN("createdAt") as "createdAt",
    MAX("updatedAt") as "updatedAt"
FROM "AllergenDerivatives"
WHERE allergen IS NOT NULL OR derivative IS NOT NULL
GROUP BY 
    standardize_single_allergen(allergen),
    standardize_single_allergen(derivative);

-- Clear the original table
DELETE FROM "AllergenDerivatives";

-- Insert the standardized data back
INSERT INTO "AllergenDerivatives" (allergen, derivative, "createdAt", "updatedAt")
SELECT allergen, derivative, "createdAt", "updatedAt"
FROM temp_allergen_derivatives;

-- Drop temp table
DROP TABLE temp_allergen_derivatives;

-- Step 4: Update SearchPreferences (handle jsonb arrays)
-- Create a function to standardize jsonb arrays
CREATE OR REPLACE FUNCTION standardize_jsonb_allergen_array(allergen_jsonb JSONB)
RETURNS JSONB AS $$
DECLARE
    standardized_allergens TEXT[] := ARRAY[]::TEXT[];
    allergen TEXT;
    standardized_allergen TEXT;
BEGIN
    -- If jsonb is null or empty, return empty array
    IF allergen_jsonb IS NULL OR allergen_jsonb = '[]'::jsonb THEN
        RETURN '[]'::jsonb;
    END IF;
    
    -- Convert jsonb array to text array and standardize each allergen
    FOREACH allergen IN ARRAY ARRAY(SELECT jsonb_array_elements_text(allergen_jsonb))
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
        
        -- Add to standardized array if not already present
        IF NOT (standardized_allergen = ANY(standardized_allergens)) THEN
            standardized_allergens := array_append(standardized_allergens, standardized_allergen);
        END IF;
    END LOOP;
    
    -- Convert back to jsonb
    RETURN to_jsonb(standardized_allergens);
END;
$$ LANGUAGE plpgsql;

UPDATE "SearchPreferences" 
SET selectedAllergens = standardize_jsonb_allergen_array(selectedAllergens)
WHERE selectedAllergens IS NOT NULL 
AND selectedAllergens != '[]'::jsonb;

-- Step 5: Update Ingredients in batches
DO $$
DECLARE
    batch_size INTEGER := 500;
    total_updated INTEGER := 0;
    batch_updated INTEGER;
    offset_val INTEGER := 0;
BEGIN
    LOOP
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
        
        IF batch_updated = 0 THEN
            EXIT;
        END IF;
        
        total_updated := total_updated + batch_updated;
        offset_val := offset_val + batch_size;
        
        RAISE NOTICE 'Updated % rows in Ingredients (total: %)', batch_updated, total_updated;
    END LOOP;
END $$;

-- Step 6: Update IngredientCategorized in batches
DO $$
DECLARE
    batch_size INTEGER := 500;
    total_updated INTEGER := 0;
    batch_updated INTEGER;
    offset_val INTEGER := 0;
BEGIN
    LOOP
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
            EXIT;
        END IF;
        
        total_updated := total_updated + batch_updated;
        offset_val := offset_val + batch_size;
        
        RAISE NOTICE 'Updated % rows in IngredientCategorized (total: %)', batch_updated, total_updated;
    END LOOP;
END $$;

-- Step 7: Clean up
DROP FUNCTION IF EXISTS standardize_allergen_array(TEXT[]);
DROP FUNCTION IF EXISTS standardize_single_allergen(TEXT);
DROP FUNCTION IF EXISTS standardize_jsonb_allergen_array(JSONB);

-- Step 8: Verification
SELECT 'Migration complete - check results above for progress' as status; 