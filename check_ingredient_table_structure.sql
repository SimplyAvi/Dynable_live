-- Check IngredientCategorized Table Structure
-- This script will show us the actual columns in the IngredientCategorized table

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'IngredientCategorized' 
ORDER BY ordinal_position;

-- Also check the table size
SELECT 
    COUNT(*) as total_records
FROM "IngredientCategorized";

-- Check for any existing indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'; 