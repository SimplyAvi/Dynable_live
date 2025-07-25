-- Optimize IngredientCategorized Query to Prevent Timeouts
-- This script adds indexes and optimizes the query structure

-- Step 1: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_description ON "IngredientCategorized"(description);
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_name ON "IngredientCategorized"(name);
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