-- Check what columns actually exist in IngredientCategorized table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'IngredientCategorized' 
ORDER BY ordinal_position; 