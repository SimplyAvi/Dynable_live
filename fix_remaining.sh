#!/bin/bash

echo "🎯 Fixing remaining non-camelCase allergens..."

DB_URL="postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres"

echo "📊 Creating standardization function..."
psql "$DB_URL" -c "
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
            WHEN 'apples' THEN 'apples'
            WHEN 'avocados' THEN 'avocados'
            WHEN 'bananas' THEN 'bananas'
            WHEN 'beef' THEN 'beef'
            WHEN 'chicken' THEN 'chicken'
            WHEN 'chocolate' THEN 'chocolate'
            WHEN 'citrusfruits' THEN 'citrusFruits'
            WHEN 'kiwi' THEN 'kiwi'
            WHEN 'mustard' THEN 'mustard'
            WHEN 'onions' THEN 'onions'
            WHEN 'peaches' THEN 'peaches'
            WHEN 'pork' THEN 'pork'
            WHEN 'strawberries' THEN 'strawberries'
            WHEN 'tomatoes' THEN 'tomatoes'
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

echo "📊 Updating remaining non-camelCase allergens..."
psql "$DB_URL" -c "
UPDATE \"IngredientCategorized\" 
SET allergens = standardize_allergen_array(allergens)
WHERE allergens IS NOT NULL 
AND EXISTS (
    SELECT 1 FROM unnest(allergens) a 
    WHERE a != LOWER(a) 
    AND a NOT IN ('treeNuts')
);
"

echo "📊 Cleaning up function..."
psql "$DB_URL" -c "
DROP FUNCTION IF EXISTS standardize_allergen_array(TEXT[]);
"

echo "✅ Remaining non-camelCase allergens fixed!" 