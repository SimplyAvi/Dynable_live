-- Add Custom Allergens Support to Users Table
-- Author: Justin Linzan
-- Date: January 2025

-- Add custom_allergens column to Users table
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS custom_allergens JSONB DEFAULT '[]';

-- Create index for performance on custom allergens
CREATE INDEX IF NOT EXISTS idx_users_custom_allergens 
ON "Users" USING GIN (custom_allergens);

-- Add comment for documentation
COMMENT ON COLUMN "Users".custom_allergens IS 'Array of custom allergens added by the user';

-- Example structure for custom_allergens JSONB:
-- [
--   {
--     "id": "custom_1",
--     "name": "artificial sweeteners",
--     "displayName": "Artificial Sweeteners",
--     "createdAt": "2025-01-15T10:30:00Z",
--     "isActive": true
--   }
-- ]
