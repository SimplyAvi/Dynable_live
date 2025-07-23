-- MINIMAL SAFE CLEANUP - Only removes temporary tables
-- Run these one by one in Supabase SQL Editor

-- Step 1: Check what temporary tables exist (SAFE)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE '%temp%' OR tablename LIKE '%migration%' OR tablename LIKE '%backup%');

-- Step 2: Only drop temporary tables (SAFE - only removes temp tables)
-- Uncomment these lines one by one after checking what exists above

-- DROP TABLE IF EXISTS temp_food_migration;
-- DROP TABLE IF EXISTS food_migration_temp;
-- DROP TABLE IF EXISTS migration_backup;
-- DROP TABLE IF EXISTS food_backup;
-- DROP TABLE IF EXISTS temp_food;

-- Step 3: Vacuum to reclaim space (SAFE)
-- VACUUM;

-- Step 4: Check disk usage after cleanup (SAFE)
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size_after_cleanup,
    pg_database_size(current_database()) as database_bytes_after_cleanup; 