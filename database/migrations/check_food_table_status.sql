-- Check Food Table Status
-- Run in Supabase SQL Editor

-- 1. Check if Food table exists and has data
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Food'
    ) as food_table_exists;

-- 2. Count Food records
SELECT COUNT(*) as food_count FROM "Food";

-- 3. Check Food table size
SELECT 
    pg_size_pretty(pg_total_relation_size('public.Food')) as food_table_size,
    pg_total_relation_size('public.Food') as food_table_size_bytes
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Food';

-- 4. Sample some Food records to see what's there
SELECT 
    "id", 
    "description", 
    "fdcId", 
    "brandName",
    "canonicalTag",
    "canonicalTags"
FROM "Food" 
LIMIT 5;

-- 5. Check for any large text fields that might be causing bloat
SELECT 
    "id",
    LENGTH("description") as desc_length,
    LENGTH("ingredients") as ingredients_length,
    LENGTH("allergens") as allergens_length
FROM "Food" 
ORDER BY LENGTH("description") DESC 
LIMIT 10; 