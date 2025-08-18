-- 🔍 DATABASE PERFORMANCE DIAGNOSTIC
-- Run this in Supabase SQL Editor to identify timeout causes

-- 1. Check table sizes and record counts
SELECT 
    'IngredientCategorized' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_records,
    ROUND(COUNT(CASE WHEN is_active = true THEN 1 END) * 100.0 / COUNT(*), 2) as active_percentage
FROM "IngredientCategorized";

-- 2. Check existing indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'
ORDER BY indexname;

-- 3. Check if the is_active index exists
SELECT 
    'is_active index check' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'IngredientCategorized' 
            AND indexname LIKE '%is_active%'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 4. Test query performance with EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, description, "brandName", allergens, "canonicalTag"
FROM "IngredientCategorized"
WHERE is_active = true
LIMIT 20;

-- 5. Test query with allergen filtering
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, description, "brandName", allergens, "canonicalTag"
FROM "IngredientCategorized"
WHERE is_active = true
  AND allergens IS NOT NULL
  AND NOT (allergens && ARRAY['milk', 'peanuts'])
LIMIT 20;

-- 6. Check RLS policy performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*)
FROM "IngredientCategorized"
WHERE is_active = true OR (auth.role() = 'authenticated' AND (auth.jwt() ->> 'is_anonymous')::boolean = false);

-- 7. Check for missing indexes that should exist
SELECT 
    'Missing indexes check' as check_name,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'IngredientCategorized' 
            AND indexname = 'idx_ingredientcategorized_is_active'
        ) THEN '❌ Missing is_active index' 
        ELSE '✅ is_active index exists' 
    END as status
UNION ALL
SELECT 
    'Missing indexes check' as check_name,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'IngredientCategorized' 
            AND indexname = 'idx_ingredientcategorized_allergens'
        ) THEN '❌ Missing allergens index' 
        ELSE '✅ allergens index exists' 
    END as status; 