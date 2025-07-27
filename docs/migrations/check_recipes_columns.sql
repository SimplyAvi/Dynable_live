-- Check the exact column names in the Recipes table
-- Run this in your Supabase SQL Editor

-- 1. Check all columns in the Recipes table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Recipes'
ORDER BY ordinal_position;

-- 2. Check if there's any data in the Recipes table
SELECT COUNT(*) as recipe_count FROM "Recipes";

-- 3. Show a few sample recipes to see the data structure
SELECT * FROM "Recipes" LIMIT 3; 