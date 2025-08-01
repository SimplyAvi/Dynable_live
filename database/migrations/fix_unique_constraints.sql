-- Fix unique constraints for existing tables
-- Author: Justin Linzan
-- Date: January 2025

-- Add unique constraints to existing tables
ALTER TABLE "ProductCanonical" ADD CONSTRAINT "ProductCanonical_canonical_product_name_key" UNIQUE (canonical_product_name);
ALTER TABLE "IngredientCanonical" ADD CONSTRAINT "IngredientCanonical_canonical_ingredient_key" UNIQUE (canonical_ingredient);

-- Verify the constraints were added
SELECT 
    table_name, 
    constraint_name, 
    constraint_type 
FROM information_schema.table_constraints 
WHERE table_name IN ('ProductCanonical', 'IngredientCanonical') 
AND constraint_type = 'UNIQUE'; 