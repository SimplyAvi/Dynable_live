#!/bin/bash

# 🎯 MIGRATION SCRIPT USING PSQL COMMAND LINE
# This script runs the migration using psql to avoid timeout issues

echo "🚀 Starting allergen data migration using psql..."

# Set PostgreSQL connection parameters from .env file
DB_URL="postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres"

echo "📊 Step 1: Creating standardization functions..."
psql "$DB_URL" -c "
-- Create standardization functions
CREATE OR REPLACE FUNCTION standardize_allergen_array(allergen_array TEXT[])
RETURNS TEXT[] AS \$\$
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
\$\$ LANGUAGE plpgsql;
"

echo "📊 Step 2: Creating single allergen standardization function..."
psql "$DB_URL" -c "
CREATE OR REPLACE FUNCTION standardize_single_allergen(allergen_text TEXT)
RETURNS TEXT AS \$\$
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
\$\$ LANGUAGE plpgsql;
"

echo "📊 Step 3: Creating JSONB standardization function..."
psql "$DB_URL" -c "
CREATE OR REPLACE FUNCTION standardize_jsonb_allergen_array(allergen_jsonb JSONB)
RETURNS JSONB AS \$\$
DECLARE
    standardized_allergens TEXT[] := ARRAY[]::TEXT[];
    allergen TEXT;
    standardized_allergen TEXT;
BEGIN
    IF allergen_jsonb IS NULL OR allergen_jsonb = '[]'::jsonb THEN
        RETURN '[]'::jsonb;
    END IF;
    
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
        
        IF NOT (standardized_allergen = ANY(standardized_allergens)) THEN
            standardized_allergens := array_append(standardized_allergens, standardized_allergen);
        END IF;
    END LOOP;
    
    RETURN to_jsonb(standardized_allergens);
END;
\$\$ LANGUAGE plpgsql;
"

echo "📊 Step 4: Renaming SearchPreferences column..."
psql "$DB_URL" -c "
ALTER TABLE \"SearchPreferences\" 
RENAME COLUMN selected_allergens TO selectedAllergens;
"

echo "📊 Step 5: Handling AllergenDerivatives safely..."
psql "$DB_URL" -c "
-- Create temporary table with standardized data
CREATE TEMP TABLE temp_allergen_derivatives AS
SELECT DISTINCT
    standardize_single_allergen(allergen) as allergen,
    standardize_single_allergen(derivative) as derivative,
    MIN(\"createdAt\") as \"createdAt\",
    MAX(\"updatedAt\") as \"updatedAt\"
FROM \"AllergenDerivatives\"
WHERE allergen IS NOT NULL OR derivative IS NOT NULL
GROUP BY 
    standardize_single_allergen(allergen),
    standardize_single_allergen(derivative);

-- Clear the original table
DELETE FROM \"AllergenDerivatives\";

-- Insert the standardized data back
INSERT INTO \"AllergenDerivatives\" (allergen, derivative, \"createdAt\", \"updatedAt\")
SELECT allergen, derivative, \"createdAt\", \"updatedAt\"
FROM temp_allergen_derivatives;

-- Drop temp table
DROP TABLE temp_allergen_derivatives;
"

echo "📊 Step 6: Updating SearchPreferences..."
psql "$DB_URL" -c "
UPDATE \"SearchPreferences\" 
SET selectedAllergens = standardize_jsonb_allergen_array(selectedAllergens)
WHERE selectedAllergens IS NOT NULL 
AND selectedAllergens != '[]'::jsonb;
"

echo "📊 Step 7: Updating Ingredients in batches..."
psql "$DB_URL" -c "
DO \$\$
DECLARE
    batch_size INTEGER := 100;
    total_updated INTEGER := 0;
    batch_updated INTEGER;
    offset_val INTEGER := 0;
BEGIN
    LOOP
        UPDATE \"Ingredients\" 
        SET allergens = standardize_allergen_array(allergens)
        WHERE id IN (
            SELECT id FROM \"Ingredients\" 
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
END \$\$;
"

echo "📊 Step 8: Updating IngredientCategorized in batches..."
psql "$DB_URL" -c "
DO \$\$
DECLARE
    batch_size INTEGER := 100;
    total_updated INTEGER := 0;
    batch_updated INTEGER;
    offset_val INTEGER := 0;
BEGIN
    LOOP
        UPDATE \"IngredientCategorized\" 
        SET allergens = standardize_allergen_array(allergens)
        WHERE id IN (
            SELECT id FROM \"IngredientCategorized\" 
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
END \$\$;
"

echo "📊 Step 9: Cleaning up functions..."
psql "$DB_URL" -c "
DROP FUNCTION IF EXISTS standardize_allergen_array(TEXT[]);
DROP FUNCTION IF EXISTS standardize_single_allergen(TEXT);
DROP FUNCTION IF EXISTS standardize_jsonb_allergen_array(JSONB);
"

echo "📊 Step 10: Migration verification..."
psql "$DB_URL" -c "
SELECT 'Migration complete!' as status;
SELECT 'Allergen data has been standardized to camelCase format' as message;
"

echo "✅ Migration completed successfully!" 