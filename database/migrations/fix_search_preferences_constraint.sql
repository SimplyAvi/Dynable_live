-- Fix SearchPreferences table constraint
-- Author: Justin Linzan
-- Date: January 2025
-- 
-- Add unique constraint on supabase_user_id to enable ON CONFLICT functionality

-- Add unique constraint on supabase_user_id
ALTER TABLE "SearchPreferences" 
ADD CONSTRAINT "SearchPreferences_supabase_user_id_key" 
UNIQUE ("supabase_user_id");

-- Verify the constraint was added
SELECT 'SearchPreferences unique constraint added successfully' as status; 