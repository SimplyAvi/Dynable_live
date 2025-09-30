-- Set testjjuser@gmail.com as Standard tier user
-- Author: Justin Linzan
-- Date: September 2025

-- Update the specific user to Standard tier
UPDATE "Users" 
SET role = 'standard' 
WHERE email = 'testjjuser@gmail.com';

-- Verify the update
SELECT 
    id,
    email,
    name,
    role,
    custom_allergens,
    "createdAt"
FROM "Users" 
WHERE email = 'testjjuser@gmail.com';

-- Show all users and their tiers for verification
SELECT 
    email,
    role,
    CASE 
        WHEN role = 'free' THEN 'Free (2 allergens max)'
        WHEN role = 'standard' THEN 'Standard (Unlimited + Custom)'
        WHEN role = 'premium' THEN 'Premium (All features)'
        WHEN role = 'admin' THEN 'Admin (Full access)'
        WHEN role = 'seller' THEN 'Seller (Product management)'
        ELSE 'Unknown'
    END as tier_description
FROM "Users" 
ORDER BY role, email;
