-- Check the exact case-sensitive table name for recipes
-- Run this in your Supabase SQL Editor

-- 1. Check all tables with 'recipe' in the name (case insensitive)
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name ILIKE '%recipe%'
ORDER BY table_name;

-- 2. Check if it's lowercase 'recipes'
SELECT COUNT(*) FROM recipes;

-- 3. Check if it's uppercase 'RECIPES'
SELECT COUNT(*) FROM "RECIPES";

-- 4. Check if it's mixed case 'Recipes'
SELECT COUNT(*) FROM "Recipes";

-- 5. List all tables again to see the exact case
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
   AND (table_name ILIKE '%recipe%' OR table_name ILIKE '%Recipe%')
ORDER BY table_name; 