-- 🚨 FIXED: Allergen Filtering Performance Optimization
-- Corrected column names for Supabase

-- Step 1: Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: Create trigram index (MOST CRITICAL)
CREATE INDEX idx_ingredient_description_trgm 
ON "IngredientCategorized" USING gin(description gin_trgm_ops);

-- Step 3: Create full-text search index
CREATE INDEX idx_ingredient_description_fts 
ON "IngredientCategorized" USING gin(to_tsvector('english', description));

-- Step 4: Create brand filter index (FIXED column name)
CREATE INDEX idx_ingredient_brand 
ON "IngredientCategorized" ("brandName") 
WHERE "brandName" IS NOT NULL AND "brandName" != 'generic';

-- Step 5: Create composite allergen index
CREATE INDEX idx_ingredient_common_allergens
ON "IngredientCategorized" (description) 
WHERE description ILIKE '%milk%' OR description ILIKE '%peanuts%' 
   OR description ILIKE '%gluten%' OR description ILIKE '%wheat%'
   OR description ILIKE '%eggs%' OR description ILIKE '%soy%';

-- Step 6: Verify indexes were created
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'
ORDER BY indexname;

-- Step 7: Test performance (should complete in <2 seconds)
SELECT COUNT(*) FROM "IngredientCategorized" 
WHERE description NOT ILIKE '%milk%' 
AND description NOT ILIKE '%peanuts%'
AND "brandName" != 'generic' LIMIT 1000; 