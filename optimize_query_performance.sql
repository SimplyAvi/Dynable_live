-- 🚀 QUERY PERFORMANCE OPTIMIZATION
-- Run this in Supabase SQL Editor to add performance indexes

-- 1. Add index on allergens column for faster filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredientcategorized_allergens_gin
ON "IngredientCategorized" USING GIN (allergens)
WHERE allergens IS NOT NULL;

-- 2. Add composite index for description search + allergens
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredientcategorized_description_allergens
ON "IngredientCategorized" (description, allergens)
WHERE description IS NOT NULL;

-- 3. Add index for pagination performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredientcategorized_id_pagination
ON "IngredientCategorized" (id)
WHERE id IS NOT NULL;

-- 4. Add index for brand name filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredientcategorized_brandname
ON "IngredientCategorized" ("brandName")
WHERE "brandName" IS NOT NULL;

-- 5. Verify indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'
  AND indexname LIKE 'idx_ingredientcategorized_%'
ORDER BY indexname;

-- 6. Test query performance with new indexes
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, description, "brandName", allergens, "canonicalTag"
FROM "IngredientCategorized"
WHERE allergens IS NOT NULL
  AND NOT (allergens && ARRAY['milk', 'peanuts']::character varying[])
LIMIT 20;

-- 7. Test basic query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, description, "brandName", allergens, "canonicalTag"
FROM "IngredientCategorized"
LIMIT 20; 