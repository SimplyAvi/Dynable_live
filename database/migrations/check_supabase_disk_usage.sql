-- Emergency Disk Usage Analysis for Supabase
-- Run this in Supabase SQL Editor

-- 1. Check total database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- 2. Check table sizes (ordered by largest first)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Check Food table specifically
SELECT 
    COUNT(*) as food_count,
    pg_size_pretty(pg_total_relation_size('public.Food')) as food_table_size
FROM "Food";

-- 4. Check for large indexes
SELECT 
    indexname,
    tablename,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC
LIMIT 10;

-- 5. Check for temporary tables
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%temp%' OR tablename LIKE '%migration%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC; 