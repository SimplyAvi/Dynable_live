-- Use Committed Enum Values
-- Author: Justin Linzan
-- Date: September 2025
-- 
-- This script uses the enum values after they've been committed

-- =============================================================================
-- STEP 1: UPDATE USERS TO NEW TIER SYSTEM
-- =============================================================================

-- Now that enum values are committed, we can use them
UPDATE "Users" 
SET role = 'free'::"enum_Users_role" 
WHERE role = 'end_user';

-- =============================================================================
-- STEP 2: ADD CUSTOM ALLERGENS COLUMN
-- =============================================================================

-- Add custom_allergens column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS custom_allergens JSONB DEFAULT '[]';

-- Create index for custom allergens queries
CREATE INDEX IF NOT EXISTS idx_users_custom_allergens ON "Users" USING GIN (custom_allergens);

-- =============================================================================
-- STEP 3: SET TEST USER TO STANDARD TIER
-- =============================================================================

-- Set testjjuser@gmail.com as Standard tier user
UPDATE "Users" 
SET role = 'standard'::"enum_Users_role" 
WHERE email = 'testjjuser@gmail.com';

-- =============================================================================
-- STEP 4: VERIFY EVERYTHING WORKED
-- =============================================================================

-- Show user distribution by role
SELECT 
    role,
    COUNT(*) as user_count,
    CASE 
        WHEN role = 'admin' THEN 'Admin (Full access)'
        WHEN role = 'seller' THEN 'Seller (Product management)'
        WHEN role = 'free' THEN 'Free (2 allergens max)'
        WHEN role = 'standard' THEN 'Standard (Unlimited + Custom)'
        WHEN role = 'premium' THEN 'Premium (All features)'
        ELSE 'Unknown'
    END as tier_description
FROM "Users" 
GROUP BY role 
ORDER BY role;

-- Show the specific test user
SELECT 
    id,
    email,
    name,
    role,
    custom_allergens,
    "createdAt"
FROM "Users" 
WHERE email = 'testjjuser@gmail.com';
