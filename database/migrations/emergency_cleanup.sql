-- EMERGENCY CLEANUP SCRIPT
-- Run these commands in Supabase SQL Editor to reduce disk usage

-- 1. Check current disk usage first
SELECT pg_size_pretty(pg_database_size(current_database())) as current_database_size;

-- 2. Clean up any temporary tables (SAFE - only removes temp tables)
DROP TABLE IF EXISTS temp_food_migration;
DROP TABLE IF EXISTS food_migration_temp;
DROP TABLE IF EXISTS migration_backup;

-- 3. Clean up any duplicate or incomplete data
-- Remove any Food records that might be duplicates or incomplete
DELETE FROM "Food" 
WHERE "description" IS NULL 
OR "description" = '' 
OR "fdcId" IS NULL;

-- 4. Vacuum to reclaim space
VACUUM FULL;

-- 5. Analyze tables for better query planning
ANALYZE;

-- 6. Check disk usage after cleanup
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size_after_cleanup;

-- 7. If Food table is still too large, consider reducing it
-- Option A: Keep only essential columns
-- Option B: Keep only recent data
-- Option C: Sample the data (keep every 10th record)

-- 8. Check Food table size after cleanup
SELECT 
    COUNT(*) as food_count,
    pg_size_pretty(pg_total_relation_size('public.Food')) as food_table_size
FROM "Food"; 