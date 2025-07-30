-- 🏭 ENTERPRISE ALLERGEN SYSTEM - PHASE 1
-- Author: Justin Linzan
-- Date: January 2025
-- 
-- This handles existing messy allergen data and standardizes it
-- Works with existing PascalCase table names and allergens ARRAY column

-- ========================================
-- PHASE 1.1: CREATE STANDARDIZATION TABLES
-- ========================================

-- Create allergen standardization mapping table
CREATE TABLE IF NOT EXISTS "AllergenStandardization" (
    id SERIAL PRIMARY KEY,
    original_allergen VARCHAR(100) NOT NULL,
    standardized_allergen VARCHAR(50) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(original_allergen)
);

-- Create safe product indicators table (if not exists)
CREATE TABLE IF NOT EXISTS "SafeProductIndicators" (
    id SERIAL PRIMARY KEY,
    allergen VARCHAR(50) NOT NULL,
    safe_phrase VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(allergen, safe_phrase)
);

-- ========================================
-- PHASE 1.2: POPULATE STANDARDIZATION DATA
-- ========================================

-- Insert allergen standardization mappings
INSERT INTO "AllergenStandardization" (original_allergen, standardized_allergen, confidence) VALUES
-- Direct mappings
('Tree Nuts', 'tree_nuts', 1.0),
('Tree nuts', 'tree_nuts', 1.0),
('tree nuts', 'tree_nuts', 1.0),
('TreeNuts', 'tree_nuts', 1.0),
('treeNuts', 'tree_nuts', 1.0),
('Tree_Nuts', 'tree_nuts', 1.0),
('tree_nuts', 'tree_nuts', 1.0),

-- Wheat to gluten mappings
('Wheat', 'gluten', 1.0),
('wheat', 'gluten', 1.0),
('WHEAT', 'gluten', 1.0),

-- Milk mappings
('Milk', 'milk', 1.0),
('milk', 'milk', 1.0),
('MILK', 'milk', 1.0),
('Dairy', 'milk', 1.0),
('dairy', 'milk', 1.0),
('DAIRY', 'milk', 1.0),

-- Peanut mappings
('Peanuts', 'peanuts', 1.0),
('peanuts', 'peanuts', 1.0),
('PEANUTS', 'peanuts', 1.0),
('Peanut', 'peanuts', 1.0),
('peanut', 'peanuts', 1.0),

-- Soy mappings
('Soy', 'soy', 1.0),
('soy', 'soy', 1.0),
('SOY', 'soy', 1.0),
('Soybean', 'soy', 1.0),
('soybean', 'soy', 1.0),

-- Egg mappings
('Eggs', 'eggs', 1.0),
('eggs', 'eggs', 1.0),
('EGGS', 'eggs', 1.0),
('Egg', 'eggs', 1.0),
('egg', 'eggs', 1.0),

-- Fish mappings
('Fish', 'fish', 1.0),
('fish', 'fish', 1.0),
('FISH', 'fish', 1.0),

-- Shellfish mappings
('Shellfish', 'shellfish', 1.0),
('shellfish', 'shellfish', 1.0),
('SHELLFISH', 'shellfish', 1.0),

-- Sesame mappings
('Sesame', 'sesame', 1.0),
('sesame', 'sesame', 1.0),
('SESAME', 'sesame', 1.0),

-- Gluten mappings
('Gluten', 'gluten', 1.0),
('gluten', 'gluten', 1.0),
('GLUTEN', 'gluten', 1.0),

-- Ignore non-allergens (confidence 0.0)
('Garlic', 'non_allergen', 0.0),
('garlic', 'non_allergen', 0.0),
('Tomatoes', 'non_allergen', 0.0),
('tomatoes', 'non_allergen', 0.0),
('Onion', 'non_allergen', 0.0),
('onion', 'non_allergen', 0.0),
('Spices', 'non_allergen', 0.0),
('spices', 'non_allergen', 0.0)
ON CONFLICT (original_allergen) DO NOTHING;

-- Insert safe product indicators
INSERT INTO "SafeProductIndicators" (allergen, safe_phrase) VALUES
-- Milk-free indicators
('milk', 'dairy-free'), ('milk', 'dairy free'), ('milk', 'milk-free'), ('milk', 'milk free'),
('milk', 'lactose-free'), ('milk', 'lactose free'), ('milk', 'no dairy'), ('milk', 'no milk'),
('milk', 'suitable for dairy allergy'), ('milk', 'dairy allergy safe'),

-- Gluten-free indicators
('gluten', 'gluten-free'), ('gluten', 'gluten free'), ('gluten', 'no gluten'), 
('gluten', 'certified gluten-free'), ('gluten', 'suitable for celiac'), ('gluten', 'celiac safe'),

-- Peanut-free indicators
('peanuts', 'peanut-free'), ('peanuts', 'peanut free'), ('peanuts', 'no peanuts'),
('peanuts', 'peanut allergy safe'), ('peanuts', 'suitable for peanut allergy'),

-- Tree nut-free indicators
('tree_nuts', 'tree nut-free'), ('tree_nuts', 'tree nut free'), ('tree_nuts', 'no tree nuts'),
('tree_nuts', 'nut-free'), ('tree_nuts', 'nut free'), ('tree_nuts', 'no nuts'),

-- Soy-free indicators
('soy', 'soy-free'), ('soy', 'soy free'), ('soy', 'no soy'), ('soy', 'soy allergy safe'),

-- Egg-free indicators
('eggs', 'egg-free'), ('eggs', 'egg free'), ('eggs', 'no eggs'), ('eggs', 'egg allergy safe'),

-- Fish-free indicators
('fish', 'fish-free'), ('fish', 'fish free'), ('fish', 'no fish'), ('fish', 'fish allergy safe'),

-- Shellfish-free indicators
('shellfish', 'shellfish-free'), ('shellfish', 'shellfish free'), ('shellfish', 'no shellfish'),

-- Sesame-free indicators
('sesame', 'sesame-free'), ('sesame', 'sesame free'), ('sesame', 'no sesame'),

-- General allergen-free indicators
('milk', 'allergen-free'), ('gluten', 'allergen-free'), ('peanuts', 'allergen-free'),
('tree_nuts', 'allergen-free'), ('soy', 'allergen-free'), ('eggs', 'allergen-free'),
('fish', 'allergen-free'), ('shellfish', 'allergen-free'), ('sesame', 'allergen-free')
ON CONFLICT (allergen, safe_phrase) DO NOTHING;

-- ========================================
-- PHASE 1.3: CREATE STANDARDIZATION FUNCTIONS
-- ========================================

-- Function to standardize a single allergen
CREATE OR REPLACE FUNCTION standardize_allergen(input_allergen TEXT)
RETURNS TEXT AS $$
DECLARE
    standardized TEXT;
BEGIN
    -- Look up standardization
    SELECT standardized_allergen INTO standardized
    FROM "AllergenStandardization"
    WHERE original_allergen ILIKE input_allergen;
    
    -- Return standardized version or original if not found
    RETURN COALESCE(standardized, input_allergen);
END;
$$ LANGUAGE plpgsql;

-- Function to standardize allergen array
CREATE OR REPLACE FUNCTION standardize_allergen_array(allergen_array TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    standardized_array TEXT[] := '{}';
    allergen TEXT;
    standardized TEXT;
BEGIN
    -- Process each allergen in the array
    FOREACH allergen IN ARRAY allergen_array LOOP
        standardized := standardize_allergen(allergen);
        
        -- Only add if it's not a non-allergen
        IF standardized != 'non_allergen' THEN
            standardized_array := array_append(standardized_array, standardized);
        END IF;
    END LOOP;
    
    RETURN standardized_array;
END;
$$ LANGUAGE plpgsql;

-- Function to process existing allergen arrays
CREATE OR REPLACE FUNCTION process_existing_allergen_arrays(batch_size INTEGER DEFAULT 100)
RETURNS JSON AS $$
DECLARE
    product_record RECORD;
    processed_count INTEGER := 0;
    total_processed INTEGER := 0;
    standardized_allergens TEXT[];
    result JSON;
BEGIN
    -- Process products that have allergens but haven't been processed yet
    FOR product_record IN 
        SELECT id, description, allergens
        FROM "IngredientCategorized"
        WHERE allergens IS NOT NULL 
        AND array_length(allergens, 1) > 0
        AND processed_for_allergens = FALSE
        LIMIT batch_size
    LOOP
        -- Standardize the allergen array
        standardized_allergens := standardize_allergen_array(product_record.allergens);
        
        -- Update the product with standardized allergens
        UPDATE "IngredientCategorized"
        SET 
            allergens = standardized_allergens,
            processed_for_allergens = TRUE,
            allergen_last_updated = NOW()
        WHERE id = product_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    total_processed := processed_count;
    
    result := json_build_object(
        'success', TRUE,
        'processed_count', total_processed,
        'message', 'Existing allergen arrays processed and standardized'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 1.4: CREATE ENTERPRISE FUNCTIONS
-- ========================================

-- Enhanced product allergen processing function
CREATE OR REPLACE FUNCTION process_product_allergens_enterprise(product_id INTEGER)
RETURNS JSON AS $$
DECLARE
    product_record RECORD;
    description_lower TEXT;
    contains_list TEXT[] := '{}';
    allergen_free_list TEXT[] := '{}';
    safe_record RECORD;
    result JSON;
    temp_allergen TEXT;
    confidence_score DECIMAL(3,2) := 1.0;
BEGIN
    -- Get the product
    SELECT * INTO product_record 
    FROM "IngredientCategorized" 
    WHERE id = product_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Product not found');
    END IF;
    
    description_lower := LOWER(product_record.description);
    
    -- 🎯 STEP 1: Check for explicit safe indicators FIRST (highest priority)
    FOR safe_record IN 
        SELECT DISTINCT allergen, safe_phrase 
        FROM "SafeProductIndicators"
        ORDER BY allergen, LENGTH(safe_phrase) DESC -- Longer phrases first
    LOOP
        IF position(LOWER(safe_record.safe_phrase) in description_lower) > 0 THEN
            -- Add to allergen_free_tags
            IF NOT (safe_record.allergen || '-free' = ANY(allergen_free_list)) THEN
                allergen_free_list := array_append(allergen_free_list, safe_record.allergen || '-free');
            END IF;
        END IF;
    END LOOP;
    
    -- 🎯 STEP 2: Use existing allergens array if available
    IF product_record.allergens IS NOT NULL AND array_length(product_record.allergens, 1) > 0 THEN
        contains_list := product_record.allergens;
        confidence_score := 0.95; -- High confidence for explicit allergen data
    END IF;
    
    -- 🎯 STEP 3: Final cleanup - remove contradictions
    -- If something is marked as both contains and free, prioritize free
    FOREACH temp_allergen IN ARRAY contains_list LOOP
        IF (temp_allergen || '-free') = ANY(allergen_free_list) THEN
            contains_list := array_remove(contains_list, temp_allergen);
        END IF;
    END LOOP;
    
    -- Update the product
    UPDATE "IngredientCategorized" 
    SET 
        allergens = contains_list,
        processed_for_allergens = TRUE,
        allergen_last_updated = NOW()
    WHERE id = product_id;
    
    result := json_build_object(
        'product_id', product_id,
        'description', product_record.description,
        'contains_allergens', contains_list,
        'allergen_free_tags', allergen_free_list,
        'confidence', confidence_score,
        'processed', TRUE
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- High-performance batch processing function
CREATE OR REPLACE FUNCTION batch_process_allergens_enterprise(batch_size INTEGER DEFAULT 1000)
RETURNS JSON AS $$
DECLARE
    unprocessed_count INTEGER;
    processed_count INTEGER := 0;
    total_processed INTEGER := 0;
    product_record RECORD;
    result JSON;
    start_time TIMESTAMP := NOW();
BEGIN
    -- Get count of unprocessed products
    SELECT COUNT(*) INTO unprocessed_count
    FROM "IngredientCategorized"
    WHERE processed_for_allergens = FALSE;
    
    RAISE NOTICE 'Starting batch processing of % unprocessed products', unprocessed_count;
    
    -- Process in batches
    WHILE unprocessed_count > 0 LOOP
        -- Get batch of unprocessed products
        FOR product_record IN 
            SELECT id 
            FROM "IngredientCategorized"
            WHERE processed_for_allergens = FALSE
            LIMIT batch_size
        LOOP
            -- Process each product
            PERFORM process_product_allergens_enterprise(product_record.id);
            processed_count := processed_count + 1;
        END LOOP;
        
        total_processed := total_processed + processed_count;
        
        -- Update unprocessed count
        SELECT COUNT(*) INTO unprocessed_count
        FROM "IngredientCategorized"
        WHERE processed_for_allergens = FALSE;
        
        -- Reset batch counter
        processed_count := 0;
        
        -- Progress logging
        RAISE NOTICE 'Processed % products, % remaining', total_processed, unprocessed_count;
        
        -- Small delay to avoid overwhelming the database
        PERFORM pg_sleep(0.05);
    END LOOP;
    
    result := json_build_object(
        'success', TRUE,
        'total_processed', total_processed,
        'processing_time_seconds', EXTRACT(EPOCH FROM (NOW() - start_time)),
        'message', 'Enterprise batch processing completed'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Ultra-fast allergen filtering function
CREATE OR REPLACE FUNCTION filter_products_by_allergens(
    search_term TEXT DEFAULT '',
    user_allergens TEXT[] DEFAULT '{}',
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id INTEGER,
    description TEXT,
    "brandName" TEXT,
    "canonicalTag" TEXT,
    allergens TEXT[],
    processed_for_allergens BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ic.id,
        ic.description,
        ic."brandName",
        ic."canonicalTag",
        ic.allergens,
        ic.processed_for_allergens
    FROM "IngredientCategorized" ic
    WHERE ic."brandName" != 'generic'
    AND ic.processed_for_allergens = TRUE
    AND (
        search_term = '' 
        OR ic.description ILIKE '%' || search_term || '%'
    )
    AND (
        array_length(user_allergens, 1) IS NULL
        OR NOT EXISTS (
            SELECT 1 
            FROM unnest(user_allergens) AS allergen
            WHERE allergen = ANY(ic.allergens)
        )
    )
    ORDER BY ic.description
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- System status check function
CREATE OR REPLACE FUNCTION check_allergen_system_status()
RETURNS JSON AS $$
DECLARE
    total_products INTEGER;
    processed_products INTEGER;
    unprocessed_products INTEGER;
    standardization_count INTEGER;
    safe_indicators_count INTEGER;
    result JSON;
BEGIN
    -- Get product counts
    SELECT COUNT(*) INTO total_products FROM "IngredientCategorized";
    SELECT COUNT(*) INTO processed_products FROM "IngredientCategorized" WHERE processed_for_allergens = TRUE;
    SELECT COUNT(*) INTO unprocessed_products FROM "IngredientCategorized" WHERE processed_for_allergens = FALSE;
    
    -- Get standardization data counts
    SELECT COUNT(*) INTO standardization_count FROM "AllergenStandardization";
    SELECT COUNT(*) INTO safe_indicators_count FROM "SafeProductIndicators";
    
    result := json_build_object(
        'system_status', CASE 
            WHEN processed_products > 0 THEN 'operational'
            ELSE 'needs_processing'
        END,
        'total_products', total_products,
        'processed_products', processed_products,
        'unprocessed_products', unprocessed_products,
        'processing_percentage', ROUND((processed_products::DECIMAL / total_products) * 100, 2),
        'standardization_mappings', standardization_count,
        'safe_indicators', safe_indicators_count,
        'ready_for_production', processed_products > 0
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Performance test function
CREATE OR REPLACE FUNCTION test_allergen_query_performance()
RETURNS JSON AS $$
DECLARE
    start_time TIMESTAMP;
    query_time_ms INTEGER;
    result JSON;
    test_results JSON[] := '{}';
BEGIN
    -- Test 1: Single allergen filtering
    start_time := NOW();
    PERFORM * FROM filter_products_by_allergens('bread', ARRAY['gluten'], 10);
    query_time_ms := EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000;
    test_results := array_append(test_results, 
        json_build_object('test', 'single_allergen', 'time_ms', query_time_ms)
    );
    
    -- Test 2: Multiple allergen filtering
    start_time := NOW();
    PERFORM * FROM filter_products_by_allergens('chocolate', ARRAY['milk', 'soy'], 10);
    query_time_ms := EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000;
    test_results := array_append(test_results, 
        json_build_object('test', 'multiple_allergens', 'time_ms', query_time_ms)
    );
    
    -- Test 3: No allergen filtering
    start_time := NOW();
    PERFORM * FROM filter_products_by_allergens('apple', '{}', 10);
    query_time_ms := EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000;
    test_results := array_append(test_results, 
        json_build_object('test', 'no_allergens', 'time_ms', query_time_ms)
    );
    
    result := json_build_object(
        'test_results', test_results,
        'performance_acceptable', query_time_ms < 100
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PHASE 1.5: INITIALIZATION COMMANDS
-- ========================================

-- Check current system status
SELECT check_allergen_system_status();

-- Process existing allergen arrays (start with small batch)
SELECT process_existing_allergen_arrays(100);

-- Test the system
SELECT test_allergen_query_performance();

-- Sample filtered queries
-- SELECT * FROM filter_products_by_allergens('bread', ARRAY['gluten'], 10);
-- SELECT * FROM filter_products_by_allergens('chocolate', ARRAY['milk'], 10);
-- SELECT * FROM filter_products_by_allergens('', ARRAY['peanuts', 'tree_nuts'], 20); 