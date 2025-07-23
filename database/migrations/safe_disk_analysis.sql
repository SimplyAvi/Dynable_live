-- SAFE DISK ANALYSIS - Run these one by one in Supabase SQL Editor
-- This will NOT make any changes, only analyze current state

-- Step 1: Check total database size (SAFE)
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as total_database_size,
    pg_database_size(current_database()) as total_bytes;

-- Step 2: Check all table sizes (SAFE)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Step 3: Check Food table specifically (SAFE)
SELECT 
    COUNT(*) as food_rows,
    pg_size_pretty(pg_total_relation_size('public.Food')) as food_table_size,
    pg_total_relation_size('public.Food') as food_table_bytes
FROM "Food";

-- Step 4: Check for any temporary tables (SAFE)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE '%temp%' OR tablename LIKE '%migration%' OR tablename LIKE '%backup%')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Step 5: Check index sizes (SAFE)
SELECT 
    indexname,
    tablename,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
    pg_relation_size(indexname::regclass) as index_bytes
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC
LIMIT 10;

-- Step 6: Check for any large text fields in Food table (SAFE)
SELECT 
    "id",
    LENGTH(COALESCE("description", '')) as desc_length,
    LENGTH(COALESCE("ingredients", '')) as ingredients_length,
    LENGTH(COALESCE("allergens", '')) as allergens_length,
    LENGTH(COALESCE("brandedFoodCategory", '')) as category_length
FROM "Food" 
ORDER BY LENGTH(COALESCE("description", '')) DESC 
LIMIT 5; 