-- MODIFIED SAFE DISK ANALYSIS - Skip Food table, focus on existing tables
-- Run these one by one in Supabase SQL Editor

-- Step 1: Check total database size (SAFE)
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as total_database_size,
    pg_database_size(current_database()) as total_bytes;

-- Step 2: List all existing tables first (SAFE)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Step 3: Check for temporary tables (SAFE)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE '%temp%' OR tablename LIKE '%migration%' OR tablename LIKE '%backup%')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Step 4: Check index sizes (SAFE)
SELECT 
    indexname,
    tablename,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size,
    pg_relation_size(indexname::regclass) as index_bytes
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC
LIMIT 10;

-- Step 5: Check for any large text fields in existing tables (SAFE)
-- This will help identify if any existing tables have bloated text fields
SELECT 
    t.tablename,
    c.column_name,
    c.data_type,
    c.character_maximum_length
FROM information_schema.columns c
JOIN pg_tables t ON c.table_name = t.tablename
WHERE c.table_schema = 'public' 
AND c.data_type IN ('text', 'character varying', 'character')
AND t.schemaname = 'public'
ORDER BY c.character_maximum_length DESC NULLS LAST
LIMIT 10; 