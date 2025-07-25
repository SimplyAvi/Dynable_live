-- Check what recipe-related tables exist in Supabase
-- Run these queries in your Supabase SQL Editor

-- 1. Check if Recipe table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name ILIKE '%recipe%' 
   OR table_name ILIKE '%Recipe%'
ORDER BY table_name;

-- 2. Check if Recipes table exists (plural)
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'Recipes' 
   OR table_name = 'recipes'
ORDER BY table_name;

-- 3. Check all tables in the database to see what's available
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. If Recipe table exists, check its structure
-- (Run this only if the first query shows a Recipe table)
-- SELECT 
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'Recipe' 
--    OR table_name = 'Recipes'
-- ORDER BY ordinal_position;

-- 5. If Recipe table exists, check if it has data
-- (Run this only if the first query shows a Recipe table)
-- SELECT COUNT(*) as recipe_count FROM Recipe;
-- SELECT COUNT(*) as recipe_count FROM Recipes; 