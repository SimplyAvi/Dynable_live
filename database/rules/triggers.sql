-- 🔄 DATABASE TRIGGERS FOR ALLERGEN RULES
-- Dynable App - Automatic Data Quality Enforcement

-- Trigger function to automatically standardize and clean allergens
CREATE OR REPLACE FUNCTION trigger_standardize_allergens()
RETURNS TRIGGER AS $$
DECLARE
    cleaned_allergens TEXT[];
    validation_result RECORD;
BEGIN
    -- Skip if allergens is null
    IF NEW.allergens IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Step 1: Standardize allergen names
    NEW.allergens := standardize_allergen_array(NEW.allergens);
    
    -- Step 2: Clean free-from contradictions
    IF NEW.description IS NOT NULL THEN
        NEW.allergens := clean_free_from_contradictions(NEW.allergens, NEW.description);
    END IF;
    
    -- Step 3: Validate the final result
    SELECT * INTO validation_result FROM validate_allergen_array(NEW.allergens);
    
    -- If validation fails, log the errors but don't block the operation
    -- (This allows for gradual cleanup while maintaining data integrity)
    IF NOT validation_result.is_valid THEN
        -- Log validation errors (you can implement logging here)
        RAISE WARNING 'Allergen validation failed for product %: %', NEW.id, array_to_string(validation_result.errors, '; ');
    END IF;
    
    -- Update the updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic allergen standardization
DROP TRIGGER IF EXISTS trigger_standardize_allergens ON "IngredientCategorized";
CREATE TRIGGER trigger_standardize_allergens
    BEFORE INSERT OR UPDATE ON "IngredientCategorized"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_standardize_allergens();

-- Trigger function to log allergen changes for audit trail
CREATE OR REPLACE FUNCTION trigger_log_allergen_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if allergens actually changed
    IF OLD.allergens IS DISTINCT FROM NEW.allergens THEN
        -- You can implement audit logging here
        -- For now, we'll just raise a notice
        RAISE NOTICE 'Allergens changed for product %: % -> %', 
            NEW.id, 
            COALESCE(array_to_string(OLD.allergens, ','), 'NULL'),
            COALESCE(array_to_string(NEW.allergens, ','), 'NULL');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging allergen changes
DROP TRIGGER IF EXISTS trigger_log_allergen_changes ON "IngredientCategorized";
CREATE TRIGGER trigger_log_allergen_changes
    AFTER UPDATE ON "IngredientCategorized"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_allergen_changes();

-- Trigger function to prevent invalid allergen insertions
CREATE OR REPLACE FUNCTION trigger_validate_allergens()
RETURNS TRIGGER AS $$
DECLARE
    validation_result RECORD;
BEGIN
    -- Skip validation if allergens is null
    IF NEW.allergens IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Validate the allergen array
    SELECT * INTO validation_result FROM validate_allergen_array(NEW.allergens);
    
    -- If validation fails, raise an error to prevent the operation
    IF NOT validation_result.is_valid THEN
        RAISE EXCEPTION 'Allergen validation failed: %', array_to_string(validation_result.errors, '; ');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for strict validation (optional - can be enabled/disabled)
-- DROP TRIGGER IF EXISTS trigger_validate_allergens ON "IngredientCategorized";
-- CREATE TRIGGER trigger_validate_allergens
--     BEFORE INSERT OR UPDATE ON "IngredientCategorized"
--     FOR EACH ROW
--     EXECUTE FUNCTION trigger_validate_allergens();

-- Function to enable strict validation
CREATE OR REPLACE FUNCTION enable_strict_allergen_validation()
RETURNS void AS $$
BEGIN
    DROP TRIGGER IF EXISTS trigger_validate_allergens ON "IngredientCategorized";
    CREATE TRIGGER trigger_validate_allergens
        BEFORE INSERT OR UPDATE ON "IngredientCategorized"
        FOR EACH ROW
        EXECUTE FUNCTION trigger_validate_allergens();
    
    RAISE NOTICE 'Strict allergen validation enabled';
END;
$$ LANGUAGE plpgsql;

-- Function to disable strict validation
CREATE OR REPLACE FUNCTION disable_strict_allergen_validation()
RETURNS void AS $$
BEGIN
    DROP TRIGGER IF EXISTS trigger_validate_allergens ON "IngredientCategorized";
    
    RAISE NOTICE 'Strict allergen validation disabled';
END;
$$ LANGUAGE plpgsql;

-- Function to check for rule violations in existing data
CREATE OR REPLACE FUNCTION check_allergen_rule_violations()
RETURNS TABLE(
    violation_type TEXT,
    product_id INTEGER,
    description TEXT,
    violating_allergen TEXT,
    total_violations BIGINT
) AS $$
BEGIN
    -- Check for spaces
    RETURN QUERY
    SELECT 
        'spaces'::TEXT as violation_type,
        ic.id as product_id,
        ic.description,
        allergen as violating_allergen,
        COUNT(*) OVER() as total_violations
    FROM "IngredientCategorized" ic,
         unnest(ic.allergens) as allergen
    WHERE allergen LIKE '% %';
    
    -- Check for underscores
    RETURN QUERY
    SELECT 
        'underscores'::TEXT as violation_type,
        ic.id as product_id,
        ic.description,
        allergen as violating_allergen,
        COUNT(*) OVER() as total_violations
    FROM "IngredientCategorized" ic,
         unnest(ic.allergens) as allergen
    WHERE allergen LIKE '%_%';
    
    -- Check for non-lowercase format
    RETURN QUERY
    SELECT 
        'non_lowercase'::TEXT as violation_type,
        ic.id as product_id,
        ic.description,
        allergen as violating_allergen,
        COUNT(*) OVER() as total_violations
    FROM "IngredientCategorized" ic,
         unnest(ic.allergens) as allergen
    WHERE allergen != lower(allergen);
    
    -- Check for invalid allergen names
    RETURN QUERY
    SELECT 
        'invalid_allergen'::TEXT as violation_type,
        ic.id as product_id,
        ic.description,
        allergen as violating_allergen,
        COUNT(*) OVER() as total_violations
    FROM "IngredientCategorized" ic,
         unnest(ic.allergens) as allergen
    WHERE NOT is_valid_allergen(allergen);
    
    -- Check for free-from contradictions
    RETURN QUERY
    SELECT 
        'free_from_contradiction'::TEXT as violation_type,
        ic.id as product_id,
        ic.description,
        allergen as violating_allergen,
        COUNT(*) OVER() as total_violations
    FROM "IngredientCategorized" ic,
         unnest(ic.allergens) as allergen
    WHERE (
        (lower(ic.description) LIKE '%gluten free%' AND allergen = 'gluten') OR
        (lower(ic.description) LIKE '%dairy free%' AND allergen = 'milk') OR
        (lower(ic.description) LIKE '%nut free%' AND allergen IN ('treenuts', 'peanuts')) OR
        (lower(ic.description) LIKE '%egg free%' AND allergen = 'eggs') OR
        (lower(ic.description) LIKE '%soy free%' AND allergen = 'soy') OR
        (lower(ic.description) LIKE '%fish free%' AND allergen IN ('fish', 'shellfish'))
    );
    
    -- Check for duplicates
    RETURN QUERY
    SELECT 
        'duplicates'::TEXT as violation_type,
        ic.id as product_id,
        ic.description,
        'duplicate allergens' as violating_allergen,
        COUNT(*) OVER() as total_violations
    FROM "IngredientCategorized" ic
    WHERE array_length(ic.allergens, 1) != array_length(array(
        SELECT DISTINCT unnest(ic.allergens)
    ), 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get violation summary
CREATE OR REPLACE FUNCTION get_allergen_violation_summary()
RETURNS TABLE(
    violation_type TEXT,
    violation_count BIGINT,
    example_product_id INTEGER,
    example_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        violation_type,
        COUNT(*) as violation_count,
        MIN(product_id) as example_product_id,
        MIN(description) as example_description
    FROM check_allergen_rule_violations()
    GROUP BY violation_type
    ORDER BY violation_count DESC;
END;
$$ LANGUAGE plpgsql; 