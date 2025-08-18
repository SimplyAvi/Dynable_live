-- 🎯 OPTIMIZE ALLERGEN QUERIES FOR BETTER PERFORMANCE
-- This script adds necessary indexes to make array-based allergen filtering fast for all users

-- Check if indexes already exist
DO $$
BEGIN
    -- Check for GIN index on allergens array
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'IngredientCategorized' 
        AND indexname = 'idx_ingredientcategorized_allergens_gin'
    ) THEN
        RAISE NOTICE 'Creating GIN index on allergens array...';
        CREATE INDEX CONCURRENTLY idx_ingredientcategorized_allergens_gin 
        ON "IngredientCategorized" USING GIN (allergens);
        RAISE NOTICE 'GIN index created successfully';
    ELSE
        RAISE NOTICE 'GIN index already exists';
    END IF;

    -- Check for partial index on products with allergens
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'IngredientCategorized' 
        AND indexname = 'idx_ingredientcategorized_has_allergens'
    ) THEN
        RAISE NOTICE 'Creating partial index for products with allergens...';
        CREATE INDEX CONCURRENTLY idx_ingredientcategorized_has_allergens 
        ON "IngredientCategorized" (id) 
        WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0;
        RAISE NOTICE 'Partial index created successfully';
    ELSE
        RAISE NOTICE 'Partial index already exists';
    END IF;

    -- Check for composite index for common queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'IngredientCategorized' 
        AND indexname = 'idx_ingredientcategorized_allergens_is_active'
    ) THEN
        RAISE NOTICE 'Creating composite index for allergens + is_active...';
        CREATE INDEX CONCURRENTLY idx_ingredientcategorized_allergens_is_active 
        ON "IngredientCategorized" (allergens, "is_active") 
        WHERE "is_active" = true;
        RAISE NOTICE 'Composite index created successfully';
    ELSE
        RAISE NOTICE 'Composite index already exists';
    END IF;

END $$;

-- Analyze table to update statistics
ANALYZE "IngredientCategorized";

-- Show index information
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized' 
AND indexname LIKE '%allergen%'
ORDER BY indexname;

-- Show table statistics
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'IngredientCategorized' 
AND attname = 'allergens';

-- Test query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, description, "brandName", allergens, "canonicalTag"
FROM "IngredientCategorized"
WHERE "is_active" = true
AND NOT (allergens && ARRAY['Milk', 'Peanuts'])
LIMIT 20;

-- Show current table size and index sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE tablename = 'IngredientCategorized'; 