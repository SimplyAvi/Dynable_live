-- ===== SUPABASE CURRENT STATE ASSESSMENT =====
-- Run this in Supabase SQL Editor to see what's already populated

-- 1. Basic table counts
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
  'Categories' as table_name, COUNT(*) as count FROM "Categories"
UNION ALL SELECT 
  'Subcategories' as table_name, COUNT(*) as count FROM "Subcategories";

-- 2. Check ingredient mapping coverage
SELECT 
  COUNT(DISTINCT i.name) as total_unique_ingredients,
  COUNT(itc.id) as mapped_ingredients,
  ROUND(COUNT(itc.id)::numeric / COUNT(DISTINCT i.name) * 100, 2) as mapping_percentage
FROM "Ingredients" i
LEFT JOIN "IngredientToCanonicals" itc ON LOWER(TRIM(i.name)) = LOWER(itc."messyName");

-- 3. Check product tagging status
SELECT 
  COUNT(*) as total_food_products,
  COUNT(CASE WHEN "canonicalTags" IS NOT NULL AND array_length("canonicalTags", 1) > 0 THEN 1 END) as tagged_products,
  ROUND(COUNT(CASE WHEN "canonicalTags" IS NOT NULL AND array_length("canonicalTags", 1) > 0 THEN 1 END)::numeric / COUNT(*) * 100, 2) as percentage_tagged
FROM "Food";

-- 4. Check for unmapped ingredients (sample)
SELECT 
  i.name as ingredient_name,
  COUNT(*) as recipe_count
FROM "Ingredients" i
LEFT JOIN "IngredientToCanonicals" itc ON LOWER(TRIM(i.name)) = LOWER(itc."messyName")
WHERE itc.id IS NULL
GROUP BY i.name
ORDER BY recipe_count DESC
LIMIT 20;

-- 5. Check canonical ingredients coverage
SELECT 
  COUNT(*) as total_canonicals,
  COUNT(CASE WHEN "description" IS NOT NULL AND "description" != '' THEN 1 END) as with_descriptions,
  COUNT(CASE WHEN "category" IS NOT NULL AND "category" != '' THEN 1 END) as with_categories
FROM "CanonicalIngredients";

-- 6. Check allergen system
SELECT 
  COUNT(*) as total_allergens,
  COUNT(CASE WHEN "derivatives" IS NOT NULL AND array_length("derivatives", 1) > 0 THEN 1 END) as with_derivatives
FROM "AllergenDerivatives"; 