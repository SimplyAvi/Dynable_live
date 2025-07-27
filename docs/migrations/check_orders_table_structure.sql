-- Check Orders Table Structure
-- This script will show us the actual columns in the Orders table

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Orders' 
ORDER BY ordinal_position;

-- Also check if there are any existing RLS policies
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'Orders'
ORDER BY policyname; 