-- Check Orders Table Required Columns
-- This script will show us what columns are required and their constraints

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_identity
FROM information_schema.columns 
WHERE table_name = 'Orders' 
ORDER BY ordinal_position;

-- Check for any NOT NULL constraints
SELECT 
    tc.column_name,
    tc.is_nullable,
    tc.data_type,
    tc.column_default
FROM information_schema.table_constraints tc
JOIN information_schema.columns c ON tc.table_name = c.table_name
WHERE tc.table_name = 'Orders' 
AND tc.constraint_type = 'CHECK'
ORDER BY tc.column_name; 