-- Check the exact column names in the Carts table
-- Run this in your Supabase SQL Editor

-- 1. Check all columns in the Carts table
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Carts'
ORDER BY ordinal_position;

-- 2. Check if there's any data in the Carts table
SELECT COUNT(*) as cart_count FROM "Carts";

-- 3. Show a few sample cart records to see the data structure
SELECT * FROM "Carts" LIMIT 3;

-- 4. Check the Users table structure too
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Users'
ORDER BY ordinal_position; 