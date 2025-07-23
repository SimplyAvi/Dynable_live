-- ===== PRE-MIGRATION STATE CHECK =====
-- Run this in Supabase SQL Editor before starting Phase 1

-- 1. Check current table counts
SELECT 
  'Recipes' as table_name, COUNT(*) as count FROM "Recipes"
UNION ALL SELECT 
  'Ingredients' as table_name, COUNT(*) as count FROM "Ingredients"
UNION ALL SELECT 
  'Food' as table_name, COUNT(*) as count FROM "Food"
UNION ALL SELECT 
  'CanonicalIngredients' as table_name, COUNT(*) as count FROM "CanonicalIngredients"
UNION ALL SELECT 
  'IngredientToCanonicals' as table_name, COUNT(*) as count FROM "IngredientToCanonicals"
UNION ALL SELECT 
  'AllergenDerivatives' as table_name, COUNT(*) as count FROM "AllergenDerivatives";

-- 2. Check current mapping coverage (should be 0% before migration)
SELECT 
  COUNT(DISTINCT i.name) as total_unique_ingredients,
  COUNT(itc.id) as mapped_ingredients,
  ROUND(COUNT(itc.id)::numeric / COUNT(DISTINCT i.name) * 100, 2) as mapping_percentage
FROM "Ingredients" i
LEFT JOIN "IngredientToCanonicals" itc ON LOWER(TRIM(i.name)) = LOWER(itc."messyName");

-- 3. Check current product tagging (should be 0% before migration)
SELECT 
  COUNT(*) as total_food_products,
  COUNT(CASE WHEN "canonicalTags" IS NOT NULL AND array_length("canonicalTags", 1) > 0 THEN 1 END) as tagged_products,
  ROUND(COUNT(CASE WHEN "canonicalTags" IS NOT NULL AND array_length("canonicalTags", 1) > 0 THEN 1 END)::numeric / COUNT(*) * 100, 2) as percentage_tagged
FROM "Food";

-- 4. Check allergen data (should be empty before migration)
SELECT 
  COUNT(*) as total_allergens,
  COUNT(CASE WHEN "derivative" IS NOT NULL AND "derivative" != '' THEN 1 END) as with_derivatives
FROM "AllergenDerivatives"; 