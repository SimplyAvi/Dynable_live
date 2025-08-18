-- 🚀 DATABASE PERFORMANCE OPTIMIZATION SCRIPT
-- Execute this in your Supabase SQL Editor to fix timeout issues
-- Author: Justin Linzan
-- Date: January 2025

-- ========================================
-- PHASE 1: ENABLE REQUIRED EXTENSIONS
-- ========================================

-- Enable trigram extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable btree_gin extension for GIN indexes
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ========================================
-- PHASE 2: CREATE CRITICAL INDEXES
-- ========================================

-- 1. Trigram index for fast ILIKE operations on description
-- This is the most critical index for allergen filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_description_trgm 
ON "IngredientCategorized" USING gin(description gin_trgm_ops);

-- 2. GIN index for allergen arrays (critical for allergen filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_allergens_gin 
ON "IngredientCategorized" USING gin(allergens);

-- 3. Composite index for brand filtering (exclude generics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_brand_description 
ON "IngredientCategorized" (brandName, description) 
WHERE brandName IS NOT NULL AND brandName != 'generic';

-- 4. Full-text search index as alternative approach
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_description_fts 
ON "IngredientCategorized" USING gin(to_tsvector('english', description));

-- 5. Index for canonical tag filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_canonical_tag 
ON "IngredientCategorized" ("canonicalTag") 
WHERE "canonicalTag" IS NOT NULL;

-- 6. Composite index for common allergen combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_common_allergens
ON "IngredientCategorized" (description) 
WHERE description ILIKE '%milk%' OR description ILIKE '%peanuts%' 
   OR description ILIKE '%gluten%' OR description ILIKE '%wheat%'
   OR description ILIKE '%eggs%' OR description ILIKE '%soy%';

-- ========================================
-- PHASE 3: OPTIMIZE RECIPE TABLE
-- ========================================

-- 1. Index for recipe title searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipes_title_trgm 
ON "Recipes" USING gin(title gin_trgm_ops);

-- 2. Index for recipe ingredients
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recipes_ingredients_gin 
ON "Recipes" USING gin(ingredients);

-- ========================================
-- PHASE 4: OPTIMIZE ALLERGEN TABLE
-- ========================================

-- 1. Index for allergen name searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_allergen_derivatives_name 
ON "AllergenDerivatives" (allergen);

-- ========================================
-- PHASE 5: VERIFY INDEXES WERE CREATED
-- ========================================

-- Check all indexes on IngredientCategorized
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'
ORDER BY indexname;

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'IngredientCategorized'
ORDER BY idx_scan DESC;

-- ========================================
-- PHASE 6: PERFORMANCE TESTING
-- ========================================

-- Test 1: Basic product search (should be fast)
EXPLAIN ANALYZE
SELECT COUNT(*) 
FROM "IngredientCategorized" 
WHERE description ILIKE '%bread%'
AND brandName != 'generic'
LIMIT 1000;

-- Test 2: Allergen filtering (should be fast with GIN index)
EXPLAIN ANALYZE
SELECT COUNT(*) 
FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL
AND NOT (allergens && ARRAY['milk', 'peanuts'])
AND brandName != 'generic'
LIMIT 1000;

-- Test 3: Complex allergen filtering (should be fast)
EXPLAIN ANALYZE
SELECT COUNT(*) 
FROM "IngredientCategorized" 
WHERE description NOT ILIKE '%milk%' 
AND description NOT ILIKE '%peanuts%'
AND description NOT ILIKE '%gluten%'
AND brandName != 'generic'
LIMIT 1000;

-- Test 4: Recipe search (should be fast)
EXPLAIN ANALYZE
SELECT COUNT(*) 
FROM "Recipes" 
WHERE title ILIKE '%bread%'
LIMIT 100;

-- ========================================
-- PHASE 7: CLEANUP AND MAINTENANCE
-- ========================================

-- Update table statistics for better query planning
ANALYZE "IngredientCategorized";
ANALYZE "Recipes";
ANALYZE "AllergenDerivatives";

-- Check for any unused indexes (can be dropped later)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
AND tablename IN ('IngredientCategorized', 'Recipes', 'AllergenDerivatives');

-- ========================================
-- PHASE 8: MONITORING QUERIES
-- ========================================

-- Monitor slow queries (run this periodically)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%IngredientCategorized%'
ORDER BY mean_time DESC
LIMIT 10;

-- Monitor index usage (run this periodically)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    idx_blk_read,
    idx_blk_hit
FROM pg_stat_user_indexes 
WHERE tablename = 'IngredientCategorized'
ORDER BY idx_scan DESC;

-- ========================================
-- SUCCESS CRITERIA
-- ========================================

/*
EXPECTED RESULTS AFTER OPTIMIZATION:

1. Query Performance:
   - Basic product search: < 100ms
   - Allergen filtering: < 500ms
   - Complex allergen filtering: < 1000ms
   - Recipe search: < 200ms

2. Index Usage:
   - idx_ingredient_description_trgm: High usage for text searches
   - idx_ingredient_allergens_gin: High usage for allergen filtering
   - idx_ingredient_brand_description: High usage for brand filtering

3. Timeout Elimination:
   - No more "canceling statement due to statement timeout" errors
   - All queries complete within 15 seconds
   - Graceful fallback for any remaining slow queries

4. User Experience:
   - Homepage loads in < 2 seconds
   - Allergen toggling responds in < 500ms
   - No more loading spinners that never complete
   - Smooth user experience with 50+ concurrent users
*/

-- ========================================
-- TROUBLESHOOTING
-- ========================================

-- If indexes are taking too long to create:
-- 1. Check if there are long-running queries blocking index creation
SELECT pid, query, state, query_start 
FROM pg_stat_activity 
WHERE state = 'active' 
AND query NOT LIKE '%pg_stat_activity%';

-- 2. Kill blocking queries if necessary
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query LIKE '%IngredientCategorized%';

-- If performance is still slow after indexes:
-- 1. Check if indexes are being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM "IngredientCategorized" 
WHERE description ILIKE '%bread%' 
LIMIT 10;

-- 2. Check table statistics
SELECT relname, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
FROM pg_stat_user_tables 
WHERE relname = 'IngredientCategorized';

-- 3. Update statistics if needed
ANALYZE "IngredientCategorized"; 