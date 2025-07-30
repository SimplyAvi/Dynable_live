-- 🚨 CRITICAL: Fix Allergen Filtering Performance Crisis
-- Execute these immediately on your Supabase database to resolve timeouts

-- Step 1: Enable trigram extension for ILIKE optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: Create trigram index for fast ILIKE operations on description
-- This is the most critical index for allergen filtering
CREATE INDEX CONCURRENTLY idx_ingredient_description_trgm 
ON "IngredientCategorized" USING gin(description gin_trgm_ops);

-- Step 3: Create full-text search index as alternative approach
CREATE INDEX CONCURRENTLY idx_ingredient_description_fts 
ON "IngredientCategorized" USING gin(to_tsvector('english', description));

-- Step 4: Index for brand filtering (exclude generics)
CREATE INDEX CONCURRENTLY idx_ingredient_brand 
ON "IngredientCategorized" (brandName) 
WHERE brandName IS NOT NULL AND brandName != 'generic';

-- Step 5: Composite index for common allergen combinations
CREATE INDEX CONCURRENTLY idx_ingredient_common_allergens
ON "IngredientCategorized" (description) 
WHERE description ILIKE '%milk%' OR description ILIKE '%peanuts%' 
   OR description ILIKE '%gluten%' OR description ILIKE '%wheat%'
   OR description ILIKE '%eggs%' OR description ILIKE '%soy%';

-- Step 6: Verify indexes were created successfully
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'
ORDER BY indexname;

-- Step 7: Test query performance (run this after indexes are created)
-- This should complete in under 2 seconds
EXPLAIN ANALYZE
SELECT COUNT(*) 
FROM "IngredientCategorized" 
WHERE description NOT ILIKE '%milk%' 
AND description NOT ILIKE '%peanuts%'
AND brandName != 'generic'
LIMIT 1000; 