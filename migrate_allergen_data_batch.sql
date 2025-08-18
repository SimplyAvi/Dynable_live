-- 🎯 OPTIMIZED MIGRATION - BATCH PROCESSING TO AVOID TIMEOUTS
-- Process data in small batches to prevent timeouts

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

-- Step 2: Rename SearchPreferences column first
ALTER TABLE "SearchPreferences" 
RENAME COLUMN selected_allergens TO selectedAllergens;

-- Step 3: Update AllergenDerivatives (small table, handle duplicates)
-- First, remove duplicates that would be created by standardization
DELETE FROM "AllergenDerivatives" 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM "AllergenDerivatives" 
    GROUP BY 
        CASE LOWER(allergen)
            WHEN 'treenuts' THEN 'treeNuts'
            WHEN 'treenut' THEN 'treeNuts'
            WHEN 'tree nuts' THEN 'treeNuts'
            WHEN 'tree-nuts' THEN 'treeNuts'
            WHEN 'tree_nuts' THEN 'treeNuts'
            WHEN 'nuts' THEN 'treeNuts'
            ELSE LOWER(allergen)
        END,
        CASE LOWER(derivative)
            WHEN 'treenuts' THEN 'treeNuts'
            WHEN 'treenut' THEN 'treeNuts'
            WHEN 'tree nuts' THEN 'treeNuts'
            WHEN 'tree-nuts' THEN 'treeNuts'
            WHEN 'tree_nuts' THEN 'treeNuts'
            WHEN 'nuts' THEN 'treeNuts'
            ELSE LOWER(derivative)
        END
);

-- Then update the remaining records
UPDATE "AllergenDerivatives" 
SET allergen = standardize_single_allergen(allergen),
    derivative = standardize_single_allergen(derivative)
WHERE allergen IS NOT NULL OR derivative IS NOT NULL;

-- Step 4: Update SearchPreferences (small table, no batching needed)
UPDATE "SearchPreferences" 
SET selectedAllergens = standardize_allergen_array(selectedAllergens::TEXT[])
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

-- Step 8: Verification
SELECT 'Migration complete - check results above for progress' as status; 