#!/bin/bash

echo "🎯 PHASE 3: IMPLEMENTING DATABASE VALIDATION..."

DB_URL="postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres"

echo "📊 Step 1: Creating validation functions..."
psql "$DB_URL" -c "
CREATE OR REPLACE FUNCTION validate_allergen_format(allergen_text TEXT)
RETURNS BOOLEAN AS \$\$
BEGIN
    IF allergen_text IS NULL THEN
        RETURN TRUE;
    END IF;
    
    IF allergen_text IN (
        'milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 'wheat', 'soy', 'sesame', 'gluten',
        'almonds', 'cashews', 'crab', 'lobster', 'shrimp', 'celery', 'garlic', 'corn', 'walnuts', 'lactose', 'soybeans',
        'apples', 'avocados', 'bananas', 'beef', 'chicken', 'chocolate', 'citrusfruits', 'kiwi', 'mustard', 'onions', 'peaches', 'pork', 'strawberries', 'tomatoes'
    ) THEN
        RETURN TRUE;
    END IF;
    
    IF allergen_text = LOWER(allergen_text) AND LENGTH(allergen_text) > 0 THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
\$\$ LANGUAGE plpgsql;
"

echo "📊 Step 2: Creating array validation function..."
psql "$DB_URL" -c "
CREATE OR REPLACE FUNCTION validate_allergen_array(allergen_array TEXT[])
RETURNS BOOLEAN AS \$\$
DECLARE
    allergen TEXT;
BEGIN
    IF allergen_array IS NULL THEN
        RETURN TRUE;
    END IF;
    
    FOREACH allergen IN ARRAY allergen_array
    LOOP
        IF NOT validate_allergen_format(allergen) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
\$\$ LANGUAGE plpgsql;
"

echo "📊 Step 3: Creating JSONB validation function..."
psql "$DB_URL" -c "
CREATE OR REPLACE FUNCTION validate_jsonb_allergen_array(allergen_jsonb JSONB)
RETURNS BOOLEAN AS \$\$
DECLARE
    allergen TEXT;
BEGIN
    IF allergen_jsonb IS NULL OR allergen_jsonb = '[]'::jsonb THEN
        RETURN TRUE;
    END IF;
    
    FOREACH allergen IN ARRAY ARRAY(SELECT jsonb_array_elements_text(allergen_jsonb))
    LOOP
        IF NOT validate_allergen_format(allergen) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
\$\$ LANGUAGE plpgsql;
"

echo "📊 Step 4: Creating trigger functions..."
psql "$DB_URL" -c "
CREATE OR REPLACE FUNCTION validate_ingredients_allergens()
RETURNS TRIGGER AS \$\$
BEGIN
    IF NOT validate_allergen_array(NEW.allergens) THEN
        RAISE EXCEPTION 'Invalid allergen format in Ingredients table. Allergens must be in camelCase format.';
    END IF;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_ingredient_categorized_allergens()
RETURNS TRIGGER AS \$\$
BEGIN
    IF NOT validate_allergen_array(NEW.allergens) THEN
        RAISE EXCEPTION 'Invalid allergen format in IngredientCategorized table. Allergens must be in camelCase format.';
    END IF;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_search_preferences_allergens()
RETURNS TRIGGER AS \$\$
BEGIN
    IF NOT validate_jsonb_allergen_array(NEW.selectedAllergens) THEN
        RAISE EXCEPTION 'Invalid allergen format in SearchPreferences table. Allergens must be in camelCase format.';
    END IF;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;
"

echo "📊 Step 5: Creating triggers..."
psql "$DB_URL" -c "
DROP TRIGGER IF EXISTS validate_ingredients_allergens_trigger ON \"Ingredients\";
CREATE TRIGGER validate_ingredients_allergens_trigger
    BEFORE INSERT OR UPDATE ON \"Ingredients\"
    FOR EACH ROW
    EXECUTE FUNCTION validate_ingredients_allergens();

DROP TRIGGER IF EXISTS validate_ingredient_categorized_allergens_trigger ON \"IngredientCategorized\";
CREATE TRIGGER validate_ingredient_categorized_allergens_trigger
    BEFORE INSERT OR UPDATE ON \"IngredientCategorized\"
    FOR EACH ROW
    EXECUTE FUNCTION validate_ingredient_categorized_allergens();

DROP TRIGGER IF EXISTS validate_search_preferences_allergens_trigger ON \"SearchPreferences\";
CREATE TRIGGER validate_search_preferences_allergens_trigger
    BEFORE INSERT OR UPDATE ON \"SearchPreferences\"
    FOR EACH ROW
    EXECUTE FUNCTION validate_search_preferences_allergens();
"

echo "📊 Step 6: Creating data integrity check function..."
psql "$DB_URL" -c "
CREATE OR REPLACE FUNCTION check_allergen_data_integrity()
RETURNS TABLE(
    table_name TEXT,
    total_records BIGINT,
    invalid_records BIGINT,
    status TEXT
) AS \$\$
BEGIN
    RETURN QUERY
    SELECT 
        'Ingredients'::TEXT as table_name,
        COUNT(*)::BIGINT as total_records,
        COUNT(CASE WHEN NOT validate_allergen_array(allergens) THEN 1 END)::BIGINT as invalid_records,
        CASE 
            WHEN COUNT(CASE WHEN NOT validate_allergen_array(allergens) THEN 1 END) = 0 
            THEN 'VALID'::TEXT 
            ELSE 'INVALID'::TEXT 
        END as status
    FROM \"Ingredients\";
    
    RETURN QUERY
    SELECT 
        'IngredientCategorized'::TEXT as table_name,
        COUNT(*)::BIGINT as total_records,
        COUNT(CASE WHEN NOT validate_allergen_array(allergens) THEN 1 END)::BIGINT as invalid_records,
        CASE 
            WHEN COUNT(CASE WHEN NOT validate_allergen_array(allergens) THEN 1 END) = 0 
            THEN 'VALID'::TEXT 
            ELSE 'INVALID'::TEXT 
        END as status
    FROM \"IngredientCategorized\";
    
    RETURN QUERY
    SELECT 
        'SearchPreferences'::TEXT as table_name,
        COUNT(*)::BIGINT as total_records,
        COUNT(CASE WHEN NOT validate_jsonb_allergen_array(selectedAllergens) THEN 1 END)::BIGINT as invalid_records,
        CASE 
            WHEN COUNT(CASE WHEN NOT validate_jsonb_allergen_array(selectedAllergens) THEN 1 END) = 0 
            THEN 'VALID'::TEXT 
            ELSE 'INVALID'::TEXT 
        END as status
    FROM \"SearchPreferences\";
END;
\$\$ LANGUAGE plpgsql;
"

echo "📊 Step 7: Testing validation functions..."
psql "$DB_URL" -c "
SELECT * FROM check_allergen_data_integrity();
"

echo "✅ Phase 3 database validation implemented successfully!" 