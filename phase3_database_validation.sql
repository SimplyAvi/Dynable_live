-- 🎯 PHASE 3: DATABASE VALIDATION FUNCTIONS
-- Create validation utilities to prevent future inconsistencies

-- Step 1: Create validation function for allergen format
CREATE OR REPLACE FUNCTION validate_allergen_format(allergen_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if allergen is in valid camelCase format
    IF allergen_text IS NULL THEN
        RETURN TRUE; -- NULL is valid
    END IF;
    
    -- List of valid camelCase allergens
    IF allergen_text IN (
        'milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 'wheat', 'soy', 'sesame', 'gluten',
        'almonds', 'cashews', 'crab', 'lobster', 'shrimp', 'celery', 'garlic', 'corn', 'walnuts', 'lactose', 'soybeans',
        'apples', 'avocados', 'bananas', 'beef', 'chicken', 'chocolate', 'citrusfruits', 'kiwi', 'mustard', 'onions', 'peaches', 'pork', 'strawberries', 'tomatoes'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if it's a valid lowercase allergen (for new additions)
    IF allergen_text = LOWER(allergen_text) AND LENGTH(allergen_text) > 0 THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create validation function for allergen arrays
CREATE OR REPLACE FUNCTION validate_allergen_array(allergen_array TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    allergen TEXT;
BEGIN
    IF allergen_array IS NULL THEN
        RETURN TRUE; -- NULL is valid
    END IF;
    
    FOREACH allergen IN ARRAY allergen_array
    LOOP
        IF NOT validate_allergen_format(allergen) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create validation function for JSONB allergen arrays
CREATE OR REPLACE FUNCTION validate_jsonb_allergen_array(allergen_jsonb JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    allergen TEXT;
BEGIN
    IF allergen_jsonb IS NULL OR allergen_jsonb = '[]'::jsonb THEN
        RETURN TRUE; -- NULL or empty array is valid
    END IF;
    
    FOREACH allergen IN ARRAY ARRAY(SELECT jsonb_array_elements_text(allergen_jsonb))
    LOOP
        IF NOT validate_allergen_format(allergen) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger function for Ingredients table
CREATE OR REPLACE FUNCTION validate_ingredients_allergens()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_allergen_array(NEW.allergens) THEN
        RAISE EXCEPTION 'Invalid allergen format in Ingredients table. Allergens must be in camelCase format.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger function for IngredientCategorized table
CREATE OR REPLACE FUNCTION validate_ingredient_categorized_allergens()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_allergen_array(NEW.allergens) THEN
        RAISE EXCEPTION 'Invalid allergen format in IngredientCategorized table. Allergens must be in camelCase format.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger function for SearchPreferences table
CREATE OR REPLACE FUNCTION validate_search_preferences_allergens()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_jsonb_allergen_array(NEW.selectedAllergens) THEN
        RAISE EXCEPTION 'Invalid allergen format in SearchPreferences table. Allergens must be in camelCase format.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger function for AllergenDerivatives table
CREATE OR REPLACE FUNCTION validate_allergen_derivatives()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_allergen_format(NEW.allergen) THEN
        RAISE EXCEPTION 'Invalid allergen format in AllergenDerivatives table. Allergen must be in camelCase format.';
    END IF;
    
    IF NOT validate_allergen_format(NEW.derivative) THEN
        RAISE EXCEPTION 'Invalid derivative format in AllergenDerivatives table. Derivative must be in camelCase format.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create triggers
DROP TRIGGER IF EXISTS validate_ingredients_allergens_trigger ON "Ingredients";
CREATE TRIGGER validate_ingredients_allergens_trigger
    BEFORE INSERT OR UPDATE ON "Ingredients"
    FOR EACH ROW
    EXECUTE FUNCTION validate_ingredients_allergens();

DROP TRIGGER IF EXISTS validate_ingredient_categorized_allergens_trigger ON "IngredientCategorized";
CREATE TRIGGER validate_ingredient_categorized_allergens_trigger
    BEFORE INSERT OR UPDATE ON "IngredientCategorized"
    FOR EACH ROW
    EXECUTE FUNCTION validate_ingredient_categorized_allergens();

DROP TRIGGER IF EXISTS validate_search_preferences_allergens_trigger ON "SearchPreferences";
CREATE TRIGGER validate_search_preferences_allergens_trigger
    BEFORE INSERT OR UPDATE ON "SearchPreferences"
    FOR EACH ROW
    EXECUTE FUNCTION validate_search_preferences_allergens();

DROP TRIGGER IF EXISTS validate_allergen_derivatives_trigger ON "AllergenDerivatives";
CREATE TRIGGER validate_allergen_derivatives_trigger
    BEFORE INSERT OR UPDATE ON "AllergenDerivatives"
    FOR EACH ROW
    EXECUTE FUNCTION validate_allergen_derivatives();

-- Step 9: Create data integrity check function
CREATE OR REPLACE FUNCTION check_allergen_data_integrity()
RETURNS TABLE(
    table_name TEXT,
    total_records BIGINT,
    invalid_records BIGINT,
    status TEXT
) AS $$
BEGIN
    -- Check Ingredients table
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
    FROM "Ingredients";
    
    -- Check IngredientCategorized table
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
    FROM "IngredientCategorized";
    
    -- Check SearchPreferences table
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
    FROM "SearchPreferences";
    
    -- Check AllergenDerivatives table
    RETURN QUERY
    SELECT 
        'AllergenDerivatives'::TEXT as table_name,
        COUNT(*)::BIGINT as total_records,
        COUNT(CASE WHEN NOT validate_allergen_format(allergen) OR NOT validate_allergen_format(derivative) THEN 1 END)::BIGINT as invalid_records,
        CASE 
            WHEN COUNT(CASE WHEN NOT validate_allergen_format(allergen) OR NOT validate_allergen_format(derivative) THEN 1 END) = 0 
            THEN 'VALID'::TEXT 
            ELSE 'INVALID'::TEXT 
        END as status
    FROM "AllergenDerivatives";
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create maintenance function
CREATE OR REPLACE FUNCTION log_allergen_validation_event(event_type TEXT, details JSONB)
RETURNS VOID AS $$
BEGIN
    -- This function can be used to log validation events
    -- In a production environment, you might want to insert into a logging table
    RAISE NOTICE 'Allergen validation event: % - %', event_type, details;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Verification
SELECT 'Phase 3 database validation functions created successfully!' as status; 