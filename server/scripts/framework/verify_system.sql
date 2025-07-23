-- System Verification Queries
-- Run these in your Supabase SQL editor to verify the complete system

-- 1. Product Tagging Coverage
SELECT 
  COUNT(*) as total_products,
  COUNT(canonical_tag) as tagged_products,
  ROUND((COUNT(canonical_tag)::float / COUNT(*) * 100), 1) as coverage_percent
FROM food;

-- 2. Ingredient Mapping Coverage  
SELECT 
  COUNT(*) as total_mappings,
  COUNT(DISTINCT canonical_ingredient_id) as unique_canonicals,
  ROUND((COUNT(*)::float / COUNT(DISTINCT canonical_ingredient_id)), 1) as avg_mappings_per_canonical
FROM ingredient_to_canonical;

-- 3. Allergen Coverage
SELECT 
  COUNT(*) as total_products,
  COUNT(allergens) as products_with_allergens,
  ROUND((COUNT(allergens)::float / COUNT(*) * 100), 1) as allergen_coverage_percent
FROM food;

-- 4. Sample Tagged Products
SELECT 
  description, 
  canonical_tag, 
  canonical_tag_confidence
FROM food 
WHERE canonical_tag IS NOT NULL 
ORDER BY canonical_tag_confidence DESC 
LIMIT 10;

-- 5. Canonical Ingredients Count
SELECT COUNT(*) as total_canonical_ingredients FROM canonical_ingredients;

-- 6. Allergen System Check
SELECT COUNT(*) as total_allergens FROM allergens;

-- 7. Recipe Coverage Check
SELECT COUNT(*) as total_recipes FROM recipes;

-- 8. Recipe Ingredients Coverage
SELECT COUNT(*) as total_recipe_ingredients FROM recipe_ingredients; 