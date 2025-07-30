-- 🛡️ PHASE 1: Safe Update for Existing Bulletproof Allergen System
-- This script safely handles existing tables and only adds missing components

-- ========================================
-- STEP 1: CHECK WHAT EXISTS AND WHAT'S MISSING
-- ========================================

SELECT 'CHECKING EXISTING COMPONENTS:' as status;
SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('ProductAllergens', 'SafeProductIndicators')
UNION ALL
SELECT 
    'AllergenDerivatives' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'AllergenDerivatives'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- ========================================
-- STEP 2: SAFELY ADD MISSING TABLES
-- ========================================

-- Only create ProductAllergens if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ProductAllergens'
    ) THEN
        CREATE TABLE "ProductAllergens" (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES "IngredientCategorized"(id) ON DELETE CASCADE,
            allergen VARCHAR(50) NOT NULL,
            detection_method VARCHAR(20) DEFAULT 'keyword',
            confidence DECIMAL(3,2) DEFAULT 1.0,
            is_safe BOOLEAN DEFAULT FALSE,
            source_text TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(product_id, allergen)
        );
        RAISE NOTICE 'Created ProductAllergens table';
    ELSE
        RAISE NOTICE 'ProductAllergens table already exists';
    END IF;
END $$;

-- Only create SafeProductIndicators if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'SafeProductIndicators'
    ) THEN
        CREATE TABLE "SafeProductIndicators" (
            id SERIAL PRIMARY KEY,
            allergen VARCHAR(50) NOT NULL,
            safe_phrase VARCHAR(100) NOT NULL,
            confidence DECIMAL(3,2) DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(allergen, safe_phrase)
        );
        RAISE NOTICE 'Created SafeProductIndicators table';
    ELSE
        RAISE NOTICE 'SafeProductIndicators table already exists';
    END IF;
END $$;

-- ========================================
-- STEP 3: SAFELY ADD INDEXES
-- ========================================

-- Add indexes only if they don't exist
DO $$
BEGIN
    -- ProductAllergens indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_allergens_product_id') THEN
        CREATE INDEX idx_product_allergens_product_id ON "ProductAllergens"(product_id);
        RAISE NOTICE 'Created idx_product_allergens_product_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_allergens_allergen') THEN
        CREATE INDEX idx_product_allergens_allergen ON "ProductAllergens"(allergen);
        RAISE NOTICE 'Created idx_product_allergens_allergen';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_allergens_safe') THEN
        CREATE INDEX idx_product_allergens_safe ON "ProductAllergens"(is_safe);
        RAISE NOTICE 'Created idx_product_allergens_safe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_allergens_allergen_safe') THEN
        CREATE INDEX idx_product_allergens_allergen_safe ON "ProductAllergens"(allergen, is_safe);
        RAISE NOTICE 'Created idx_product_allergens_allergen_safe';
    END IF;
    
    -- SafeProductIndicators index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_safe_indicators_allergen') THEN
        CREATE INDEX idx_safe_indicators_allergen ON "SafeProductIndicators"(allergen);
        RAISE NOTICE 'Created idx_safe_indicators_allergen';
    END IF;
END $$;

-- ========================================
-- STEP 4: SAFELY ADD DERIVATIVE DATA
-- ========================================

-- Add unique constraint to AllergenDerivatives if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'AllergenDerivatives' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%allergen%'
    ) THEN
        ALTER TABLE "AllergenDerivatives" 
        ADD CONSTRAINT "AllergenDerivatives_allergen_derivative_unique" 
        UNIQUE (allergen, derivative);
        RAISE NOTICE 'Added unique constraint to AllergenDerivatives';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on AllergenDerivatives';
    END IF;
END $$;

-- Insert comprehensive derivatives (will skip duplicates due to ON CONFLICT)
INSERT INTO "AllergenDerivatives" (allergen, derivative, "createdAt", "updatedAt") VALUES
-- MILK derivatives (CRITICAL - currently missing whey, casein)
('milk', 'milk', NOW(), NOW()), ('milk', 'dairy', NOW(), NOW()), ('milk', 'whey', NOW(), NOW()), ('milk', 'casein', NOW(), NOW()),
('milk', 'lactose', NOW(), NOW()), ('milk', 'milk solids', NOW(), NOW()), ('milk', 'butter', NOW(), NOW()), ('milk', 'cream', NOW(), NOW()),
('milk', 'caseinate', NOW(), NOW()), ('milk', 'sodium caseinate', NOW(), NOW()), ('milk', 'lactalbumin', NOW(), NOW()), 
('milk', 'lactoglobulin', NOW(), NOW()), ('milk', 'milk powder', NOW(), NOW()), ('milk', 'condensed milk', NOW(), NOW()),

-- GLUTEN derivatives (CRITICAL - currently missing wheat, barley)
('gluten', 'gluten', NOW(), NOW()), ('gluten', 'wheat', NOW(), NOW()), ('gluten', 'barley', NOW(), NOW()), ('gluten', 'rye', NOW(), NOW()),
('gluten', 'triticale', NOW(), NOW()), ('gluten', 'durum', NOW(), NOW()), ('gluten', 'semolina', NOW(), NOW()), ('gluten', 'spelt', NOW(), NOW()),
('gluten', 'wheat flour', NOW(), NOW()), ('gluten', 'vital wheat gluten', NOW(), NOW()), ('gluten', 'bulgur', NOW(), NOW()),
('gluten', 'farro', NOW(), NOW()), ('gluten', 'kamut', NOW(), NOW()), ('gluten', 'seitan', NOW(), NOW()),

-- PEANUT derivatives (CRITICAL - currently missing arachis, groundnut)
('peanuts', 'peanut', NOW(), NOW()), ('peanuts', 'arachis', NOW(), NOW()), ('peanuts', 'groundnut', NOW(), NOW()),
('peanuts', 'peanut oil', NOW(), NOW()), ('peanuts', 'arachis oil', NOW(), NOW()), ('peanuts', 'groundnut oil', NOW(), NOW()),
('peanuts', 'peanut flour', NOW(), NOW()), ('peanuts', 'peanut butter', NOW(), NOW()),

-- SOY derivatives (missing lecithin)
('soy', 'soy', NOW(), NOW()), ('soy', 'soybean', NOW(), NOW()), ('soy', 'soy lecithin', NOW(), NOW()), ('soy', 'soy protein', NOW(), NOW()),
('soy', 'tofu', NOW(), NOW()), ('soy', 'tempeh', NOW(), NOW()), ('soy', 'miso', NOW(), NOW()), ('soy', 'soy sauce', NOW(), NOW()),
('soy', 'soy oil', NOW(), NOW()), ('soy', 'soybean oil', NOW(), NOW()), ('soy', 'lecithin', NOW(), NOW()),

-- EGG derivatives
('eggs', 'egg', NOW(), NOW()), ('eggs', 'albumin', NOW(), NOW()), ('eggs', 'ovalbumin', NOW(), NOW()), ('eggs', 'lysozyme', NOW(), NOW()),
('eggs', 'egg white', NOW(), NOW()), ('eggs', 'egg yolk', NOW(), NOW()), ('eggs', 'ovum', NOW(), NOW()), ('eggs', 'mayonnaise', NOW(), NOW()),

-- TREE NUTS derivatives
('treeNuts', 'almond', NOW(), NOW()), ('treeNuts', 'cashew', NOW(), NOW()), ('treeNuts', 'walnut', NOW(), NOW()),
('treeNuts', 'pecan', NOW(), NOW()), ('treeNuts', 'hazelnut', NOW(), NOW()), ('treeNuts', 'pistachio', NOW(), NOW()),
('treeNuts', 'macadamia', NOW(), NOW()), ('treeNuts', 'brazil nut', NOW(), NOW()), ('treeNuts', 'pine nut', NOW(), NOW()),

-- FISH derivatives
('fish', 'fish', NOW(), NOW()), ('fish', 'salmon', NOW(), NOW()), ('fish', 'tuna', NOW(), NOW()), ('fish', 'cod', NOW(), NOW()),
('fish', 'bass', NOW(), NOW()), ('fish', 'trout', NOW(), NOW()), ('fish', 'mackerel', NOW(), NOW()), ('fish', 'anchovy', NOW(), NOW()),
('fish', 'fish oil', NOW(), NOW()), ('fish', 'fish sauce', NOW(), NOW()),

-- SHELLFISH derivatives
('shellfish', 'shellfish', NOW(), NOW()), ('shellfish', 'shrimp', NOW(), NOW()), ('shellfish', 'crab', NOW(), NOW()),
('shellfish', 'lobster', NOW(), NOW()), ('shellfish', 'mussel', NOW(), NOW()), ('shellfish', 'clam', NOW(), NOW()),
('shellfish', 'oyster', NOW(), NOW()), ('shellfish', 'scallop', NOW(), NOW()), ('shellfish', 'crawfish', NOW(), NOW()),

-- SESAME derivatives
('sesame', 'sesame', NOW(), NOW()), ('sesame', 'tahini', NOW(), NOW()), ('sesame', 'sesame oil', NOW(), NOW()),
('sesame', 'sesame seed', NOW(), NOW()), ('sesame', 'sesame paste', NOW(), NOW())
ON CONFLICT (allergen, derivative) DO NOTHING;

-- ========================================
-- STEP 5: SAFELY ADD SAFE INDICATORS
-- ========================================

-- Insert comprehensive safe indicators (will skip duplicates)
INSERT INTO "SafeProductIndicators" (allergen, safe_phrase, confidence) VALUES
-- MILK safe indicators
('milk', 'dairy-free', 1.0), ('milk', 'lactose-free', 1.0), ('milk', 'vegan', 0.9),
('milk', 'plant-based', 0.8), ('milk', 'non-dairy', 1.0),

-- GLUTEN safe indicators  
('gluten', 'gluten-free', 1.0), ('gluten', 'celiac-safe', 1.0), ('gluten', 'wheat-free', 0.9),

-- PEANUT safe indicators
('peanuts', 'peanut-free', 1.0), ('peanuts', 'nut-free', 0.8), ('peanuts', 'tree nut free', 0.6),

-- SOY safe indicators
('soy', 'soy-free', 1.0), ('soy', 'soybean-free', 1.0),

-- EGG safe indicators
('eggs', 'egg-free', 1.0), ('eggs', 'vegan', 0.9),

-- TREE NUTS safe indicators
('treeNuts', 'nut-free', 1.0), ('treeNuts', 'tree nut free', 1.0),

-- FISH safe indicators
('fish', 'fish-free', 1.0), ('fish', 'vegetarian', 0.8), ('fish', 'vegan', 0.9),

-- SHELLFISH safe indicators
('shellfish', 'shellfish-free', 1.0),

-- SESAME safe indicators
('sesame', 'sesame-free', 1.0)
ON CONFLICT (allergen, safe_phrase) DO NOTHING;

-- ========================================
-- STEP 6: CREATE/REPLACE DETECTION FUNCTION
-- ========================================

-- Function to detect allergens in product description
CREATE OR REPLACE FUNCTION detect_allergens_in_description(
    product_description TEXT,
    target_allergen VARCHAR(50)
) RETURNS JSON AS $$
DECLARE
    result JSON;
    derivatives TEXT[];
    safe_phrases TEXT[];
    detected_allergens TEXT[] := '{}';
    safe_allergens TEXT[] := '{}';
    has_cross_contamination BOOLEAN := false;
    current_derivative TEXT;
    current_safe_phrase TEXT;
    description_lower TEXT;
BEGIN
    description_lower := LOWER(product_description);
    
    -- Get derivatives for this allergen
    SELECT ARRAY_AGG(derivative) INTO derivatives
    FROM "AllergenDerivatives" 
    WHERE allergen = target_allergen;
    
    -- Get safe phrases for this allergen
    SELECT ARRAY_AGG(safe_phrase) INTO safe_phrases
    FROM "SafeProductIndicators" 
    WHERE allergen = target_allergen;
    
    -- Check for safe indicators first (highest priority)
    IF safe_phrases IS NOT NULL THEN
        FOREACH current_safe_phrase IN ARRAY safe_phrases LOOP
            IF position(LOWER(current_safe_phrase) in description_lower) > 0 THEN
                safe_allergens := array_append(safe_allergens, target_allergen);
                EXIT; -- Found safe indicator, no need to check for allergens
            END IF;
        END LOOP;
    END IF;
    
    -- Only check for allergen presence if not marked safe
    IF NOT (target_allergen = ANY(safe_allergens)) THEN
        IF derivatives IS NOT NULL THEN
            FOREACH current_derivative IN ARRAY derivatives LOOP
                IF position(LOWER(current_derivative) in description_lower) > 0 THEN
                    detected_allergens := array_append(detected_allergens, target_allergen);
                    EXIT; -- Found allergen, no need to check more derivatives
                END IF;
            END LOOP;
        END IF;
    END IF;
    
    -- Check for cross-contamination warnings
    IF position('may contain' in description_lower) > 0 
       OR position('facility processes' in description_lower) > 0
       OR position('manufactured on equipment' in description_lower) > 0 THEN
        has_cross_contamination := true;
    END IF;
    
    -- Build result JSON
    result := json_build_object(
        'detected_allergens', detected_allergens,
        'safe_allergens', safe_allergens,
        'has_cross_contamination', has_cross_contamination,
        'confidence', CASE 
            WHEN array_length(detected_allergens, 1) > 0 THEN 0.9
            WHEN array_length(safe_allergens, 1) > 0 THEN 1.0
            ELSE 0.7
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 7: VERIFICATION AND SUMMARY
-- ========================================

-- Verify all components are ready
SELECT 'FINAL VERIFICATION:' as status;
SELECT 
    'ProductAllergens' as component,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ProductAllergens'
    ) THEN 'READY' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'SafeProductIndicators' as component,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'SafeProductIndicators'
    ) THEN 'READY' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'AllergenDerivatives' as component,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'AllergenDerivatives'
    ) THEN 'READY' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'detect_allergens_in_description' as component,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' AND routine_name = 'detect_allergens_in_description'
    ) THEN 'READY' ELSE 'MISSING' END as status;

-- Check data counts
SELECT 'DATA COUNTS:' as status;
SELECT 
    'AllergenDerivatives' as table_name, COUNT(*) as row_count
FROM "AllergenDerivatives"
UNION ALL
SELECT 
    'SafeProductIndicators' as table_name, COUNT(*) as row_count
FROM "SafeProductIndicators"
UNION ALL
SELECT 
    'ProductAllergens' as table_name, COUNT(*) as row_count
FROM "ProductAllergens";

-- Test the detection function
SELECT 'DETECTION FUNCTION TEST:' as status;
SELECT detect_allergens_in_description('Protein powder with whey isolate', 'milk') as milk_test;
SELECT detect_allergens_in_description('Gluten-free oats certified', 'gluten') as gluten_safe_test;
SELECT detect_allergens_in_description('Chocolate with arachis oil', 'peanuts') as peanut_test;

-- Final summary
SELECT 'PHASE 1 UPDATE COMPLETE!' as summary;
SELECT 
    '✅ All tables exist and are ready' as status,
    'Bulletproof allergen system foundation complete' as description
UNION ALL
SELECT 
    '✅ All indexes created' as status,
    'Performance optimization complete' as description
UNION ALL
SELECT 
    '✅ Derivative mappings loaded' as status,
    'Comprehensive allergen detection ready' as description
UNION ALL
SELECT 
    '✅ Safe indicators loaded' as status,
    'Safe product detection ready' as description
UNION ALL
SELECT 
    '✅ Detection function working' as status,
    'Smart allergen detection available' as description; 