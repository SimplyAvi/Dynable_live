-- Check the actual schema of SubstituteMappings table
-- Run this in Supabase SQL Editor to see what columns exist

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'SubstituteMappings'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if table exists and has data
SELECT 
    COUNT(*) as row_count
FROM "SubstituteMappings";

-- Check sample data (first 5 rows)
SELECT * FROM "SubstituteMappings" LIMIT 5; 