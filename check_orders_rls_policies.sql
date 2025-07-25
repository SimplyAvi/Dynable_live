-- Check Orders Table RLS Policies
-- This script will show us what RLS policies exist for the Orders table

SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'Orders'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'Orders'; 