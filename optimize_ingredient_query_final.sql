-- Optimize IngredientCategorized Query to Prevent Timeouts - FINAL VERSION
-- This script adds indexes and optimizes the query structure using actual columns

-- Step 1: Add indexes for better performance on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_description ON "IngredientCategorized"(description);
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_food_class ON "IngredientCategorized"(foodClass);
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_branded_food_category ON "IngredientCategorized"("brandedFoodCategory");
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_canonical_tag ON "IngredientCategorized"("canonicalTag");
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_subcategory_id ON "IngredientCategorized"("SubcategoryID");

-- Step 2: Analyze table statistics for better query planning
ANALYZE "IngredientCategorized";

-- Step 3: Check current table size and performance metrics
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT description) as unique_descriptions,
    COUNT(DISTINCT "foodClass") as unique_food_classes,
    COUNT(DISTINCT "brandedFoodCategory") as unique_categories,
    COUNT(DISTINCT "canonicalTag") as unique_canonical_tags
FROM "IngredientCategorized";

-- Step 4: Show the indexes we created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'
ORDER BY indexname;

-- Step 5: Check query performance (this should be much faster now)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM "IngredientCategorized" 
ORDER BY description ASC 
LIMIT 10; 