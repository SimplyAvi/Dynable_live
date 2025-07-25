-- Optimize IngredientCategorized Query to Prevent Timeouts - CORRECTED VERSION
-- This script adds indexes and optimizes the query structure

-- Step 1: Add indexes for better performance (only on existing columns)
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_description ON "IngredientCategorized"(description);
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_category ON "IngredientCategorized"(category);

-- Step 2: Analyze table statistics for better query planning
ANALYZE "IngredientCategorized";

-- Step 3: Check current table size and structure
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT description) as unique_descriptions,
    COUNT(DISTINCT category) as unique_categories
FROM "IngredientCategorized";

-- Step 4: Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'IngredientCategorized' 
ORDER BY ordinal_position;

-- Step 5: Check for any existing indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'; 