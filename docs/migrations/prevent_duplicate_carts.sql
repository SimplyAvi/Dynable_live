-- Prevent Duplicate Carts for Same User
-- Author: Justin Linzan
-- Date: January 2025

-- =============================================================================
-- STEP 1: ADD UNIQUE CONSTRAINT TO PREVENT DUPLICATE CARTS
-- =============================================================================

-- Add unique constraint on supabase_user_id to prevent duplicate carts
ALTER TABLE "Carts" 
ADD CONSTRAINT unique_cart_per_user UNIQUE (supabase_user_id);

-- =============================================================================
-- STEP 2: CLEAN UP ANY EXISTING DUPLICATES
-- =============================================================================

-- Find and delete duplicate carts, keeping only the most recent one
DELETE FROM "Carts" 
WHERE id NOT IN (
    SELECT MAX(id) 
    FROM "Carts" 
    GROUP BY supabase_user_id
);

-- =============================================================================
-- STEP 3: VERIFY THE FIX
-- =============================================================================

-- Check for any remaining duplicates
SELECT supabase_user_id, COUNT(*) as cart_count
FROM "Carts" 
GROUP BY supabase_user_id 
HAVING COUNT(*) > 1;

-- Show the current cart structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Carts' 
ORDER BY ordinal_position; 