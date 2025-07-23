-- CHECK EXISTING TABLES AND ROW COUNTS
-- Run in Supabase SQL Editor

-- Step 1: List all tables that exist (SAFE)
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Step 2: Check row counts for each table (SAFE)
-- Run this for each table that exists
SELECT 
    'Users' as table_name,
    COUNT(*) as row_count
FROM "Users"
UNION ALL
SELECT 
    'Categories' as table_name,
    COUNT(*) as row_count
FROM "Categories"
UNION ALL
SELECT 
    'Subcategories' as table_name,
    COUNT(*) as row_count
FROM "Subcategories"
UNION ALL
SELECT 
    'Recipes' as table_name,
    COUNT(*) as row_count
FROM "Recipes"
UNION ALL
SELECT 
    'Ingredients' as table_name,
    COUNT(*) as row_count
FROM "Ingredients"
UNION ALL
SELECT 
    'IngredientToCanonicals' as table_name,
    COUNT(*) as row_count
FROM "IngredientToCanonicals"
UNION ALL
SELECT 
    'CanonicalIngredients' as table_name,
    COUNT(*) as row_count
FROM "CanonicalIngredients"
UNION ALL
SELECT 
    'IngredientMatchingRules' as table_name,
    COUNT(*) as row_count
FROM "IngredientMatchingRules"
UNION ALL
SELECT 
    'SubstituteMappings' as table_name,
    COUNT(*) as row_count
FROM "SubstituteMappings"
UNION ALL
SELECT 
    'AllergenDerivatives' as table_name,
    COUNT(*) as row_count
FROM "AllergenDerivatives"
UNION ALL
SELECT 
    'Orders' as table_name,
    COUNT(*) as row_count
FROM "Orders"
UNION ALL
SELECT 
    'Carts' as table_name,
    COUNT(*) as row_count
FROM "Carts";

-- Step 3: Check for any tables with large row counts
-- This will help identify if any table has unexpectedly many rows
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables 
WHERE schemaname = 'public'
AND pg_total_relation_size(schemaname||'.'||tablename) > 1048576  -- Tables larger than 1MB
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC; 