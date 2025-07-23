-- Phase 1: Database Schema Updates for Dynable RBAC System
-- Updated for Supabase anonymous auth handling
-- 
-- IMPORTANT NOTES FOR FUTURE DEVELOPERS:
-- - Table name is "Users" (plural, capitalized)
-- - User table uses "createdAt" (camelCase), not "created_at"
-- - IngredientCategorized already has seller_id, stock_quantity, is_active fields
-- - Migration results: 243,114 products, 0 users initially
-- - All products are active by default

-- 1. Create the user_role enum type (removed 'anonymous' since Supabase handles this differently)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'end_user', 'seller');
  END IF;
END$$;

-- 2. Add role and seller fields to Users table
ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'end_user',
  ADD COLUMN IF NOT EXISTS store_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS store_description TEXT,
  ADD COLUMN IF NOT EXISTS is_verified_seller BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS converted_from_anonymous BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous_cart_data JSONB;

-- 3. Update existing users to have end_user role
UPDATE "Users" SET role = 'end_user' WHERE role IS NULL;

-- 4. Create admin_actions table for tracking admin operations
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES "Users"(id),
    action_type VARCHAR(50) NOT NULL,
    target_user_id INTEGER REFERENCES "Users"(id),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Note: seller_id, stock_quantity, is_active already exist in IngredientCategorized
-- These fields were added in a previous migration
-- No need to add them again!

-- 6. For existing products, set seller_id based on user existence
-- (SAFE: Only assign if users exist, otherwise leave NULL for manual assignment)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Users" WHERE id = 1) THEN
    UPDATE "IngredientCategorized" SET seller_id = 1 WHERE seller_id IS NULL;
  ELSE
    -- If no users exist yet, leave seller_id as NULL for manual assignment later
    RAISE NOTICE 'No users exist yet. Products will have NULL seller_id until users are created.';
  END IF;
END$$;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON "Users"(role);
CREATE INDEX IF NOT EXISTS idx_users_verified_seller ON "Users"(is_verified_seller);
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_seller ON "IngredientCategorized"(seller_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_active ON "IngredientCategorized"(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

-- 8. Verify the migration
SELECT 
    'Users table updated' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN role = 'seller' THEN 1 END) as seller_users,
    COUNT(CASE WHEN role = 'end_user' THEN 1 END) as end_users
FROM "Users";

SELECT 
    'Products table updated' as status,
    COUNT(*) as total_products,
    COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as products_with_seller,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM "IngredientCategorized"; 