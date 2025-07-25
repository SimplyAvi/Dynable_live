-- Check the structure of the Recipes table
-- Run this in your Supabase SQL Editor

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Recipes'
ORDER BY ordinal_position;

-- Also check if there's any data in the Recipes table
SELECT COUNT(*) as recipe_count FROM Recipes;

-- Show a few sample recipes to see the data structure
SELECT * FROM Recipes LIMIT 3; 