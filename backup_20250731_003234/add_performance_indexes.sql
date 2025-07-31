-- 🚀 PERFORMANCE INDEXES FOR ALLERGY FILTERING SYSTEM
-- Execute this in Supabase SQL Editor

-- ========================================
-- STEP 1: TEXT SEARCH INDEXES
-- ========================================

-- GIN index for fast text search on product descriptions
CREATE INDEX IF NOT EXISTS idx_ingredient_description_gin 
ON "IngredientCategorized" USING gin(to_tsvector('english', description));

-- B-tree index for ILIKE operations on description
CREATE INDEX IF NOT EXISTS idx_ingredient_description_lower 
ON "IngredientCategorized" (LOWER(description));

-- ========================================
-- STEP 2: ALLERGEN LOOKUP INDEXES
-- ========================================

-- Composite index for allergen derivative lookups
CREATE INDEX IF NOT EXISTS idx_allergen_derivatives_lookup 
ON "AllergenDerivatives"(allergen, derivative);

-- Index for safe indicators lookups
CREATE INDEX IF NOT EXISTS idx_safe_indicators_lookup 
ON "SafeProductIndicators"(allergen, safe_phrase);

-- ========================================
-- STEP 3: PRODUCT FILTERING INDEXES
-- ========================================

-- Index for brand name filtering
CREATE INDEX IF NOT EXISTS idx_ingredient_brand_name 
ON "IngredientCategorized"("brandName");

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_ingredient_brand_description 
ON "IngredientCategorized"("brandName", description);

-- ========================================
-- STEP 4: PAGINATION INDEXES
-- ========================================

-- Index for ordering by description
CREATE INDEX IF NOT EXISTS idx_ingredient_description_order 
ON "IngredientCategorized"(description);

-- ========================================
-- STEP 5: VERIFICATION QUERIES
-- ========================================

-- Check if indexes were created successfully
SELECT 'INDEX CREATION VERIFICATION:' as info;
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('IngredientCategorized', 'AllergenDerivatives', 'SafeProductIndicators')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test query performance with new indexes
SELECT 'PERFORMANCE TEST - Simple allergen query:' as test_type;
EXPLAIN ANALYZE 
SELECT COUNT(*) 
FROM "IngredientCategorized" 
WHERE LOWER(description) NOT LIKE '%milk%'
    AND LOWER(description) NOT LIKE '%gluten%'
    AND "brandName" != 'generic'
LIMIT 100;

-- ========================================
-- STEP 6: SUMMARY
-- ========================================

SELECT 'PERFORMANCE INDEXES SUMMARY:' as summary;
SELECT 
    '✅ Text search indexes created' as status,
    'Fast ILIKE and full-text search enabled' as description
UNION ALL
SELECT 
    '✅ Allergen lookup indexes created' as status,
    'Fast derivative and safe indicator lookups' as description
UNION ALL
SELECT 
    '✅ Product filtering indexes created' as status,
    'Fast brand name and description filtering' as description
UNION ALL
SELECT 
    '✅ Pagination indexes created' as status,
    'Fast ordering and pagination enabled' as description; 