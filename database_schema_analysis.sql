-- COMPLETE DATABASE SCHEMA ANALYSIS FOR ALLERGEN SYSTEM
-- Run these commands in Supabase SQL Editor

-- ========================================
-- 1. COMPLETE TABLE SCHEMAS
-- ========================================

-- Get complete schema for ALL tables
\d+ "IngredientCategorized"
\d+ "Recipes" 
\d+ "RecipeIngredients"
\d+ "AllergenDerivatives"
\d+ "SubstituteMappings"
\d+ "Users"
\d+ "Carts"
\d+ "Categories"
\d+ "Subcategories"

-- Show ALL tables in database
\dt

-- Show ALL columns with data types
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- ========================================
-- 2. SAMPLE DATA ANALYSIS
-- ========================================

-- IngredientCategorized samples (show allergen patterns)
SELECT 
    id, 
    description, 
    "brandName", 
    "canonicalTag", 
    allergens, 
    ingredients,
    "canonicalTagConfidence"
FROM "IngredientCategorized" 
LIMIT 20;

-- Show variety of product descriptions for allergen analysis
SELECT DISTINCT description 
FROM "IngredientCategorized" 
WHERE description ILIKE '%milk%' 
   OR description ILIKE '%dairy%'
   OR description ILIKE '%whey%'
   OR description ILIKE '%casein%'
   OR description ILIKE '%lactose%'
LIMIT 10;

-- Show gluten-related products
SELECT DISTINCT description 
FROM "IngredientCategorized" 
WHERE description ILIKE '%gluten%' 
   OR description ILIKE '%wheat%'
   OR description ILIKE '%barley%'
   OR description ILIKE '%rye%'
LIMIT 10;

-- Show peanut-related products
SELECT DISTINCT description 
FROM "IngredientCategorized" 
WHERE description ILIKE '%peanut%' 
   OR description ILIKE '%arachis%'
   OR description ILIKE '%groundnut%'
LIMIT 10;

-- AllergenDerivatives complete data
SELECT * FROM "AllergenDerivatives" ORDER BY allergen;

-- SubstituteMappings complete data  
SELECT * FROM "SubstituteMappings" LIMIT 20;

-- RecipeIngredients samples
SELECT * FROM "RecipeIngredients" LIMIT 10;

-- ========================================
-- 3. DATA QUALITY ANALYSIS
-- ========================================

-- Check data completeness and patterns
SELECT 
  COUNT(*) as total_products,
  COUNT(description) as has_description,
  COUNT(allergens) as has_allergens,
  COUNT(ingredients) as has_ingredients,
  COUNT("brandName") as has_brand,
  COUNT("canonicalTag") as has_canonical_tag
FROM "IngredientCategorized";

-- Show distribution of allergen-related terms
SELECT 
  COUNT(*) FILTER (WHERE description ILIKE '%milk%') as milk_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%dairy%') as dairy_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%whey%') as whey_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%casein%') as casein_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%lactose%') as lactose_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%gluten%') as gluten_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%wheat%') as wheat_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%peanut%') as peanut_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%soy%') as soy_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%egg%') as egg_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%fish%') as fish_mentions,
  COUNT(*) FILTER (WHERE description ILIKE '%shellfish%') as shellfish_mentions
FROM "IngredientCategorized";

-- Find products with explicit allergen warnings
SELECT 
    description, 
    allergens, 
    ingredients 
FROM "IngredientCategorized" 
WHERE description ILIKE '%contains:%'
   OR description ILIKE '%may contain%'
   OR description ILIKE '%allergen%'
   OR description ILIKE '%warning%'
   OR allergens IS NOT NULL
LIMIT 10;

-- ========================================
-- 4. ALLERGEN DETECTION PATTERNS
-- ========================================

-- Analyze allergen column patterns
SELECT 
    allergens,
    COUNT(*) as frequency
FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL
GROUP BY allergens
ORDER BY frequency DESC
LIMIT 20;

-- Check for products with multiple allergen mentions
SELECT 
    description,
    allergens,
    ingredients
FROM "IngredientCategorized" 
WHERE description ILIKE '%milk%' AND description ILIKE '%gluten%'
   OR description ILIKE '%peanut%' AND description ILIKE '%soy%'
   OR description ILIKE '%egg%' AND description ILIKE '%fish%'
LIMIT 10;

-- ========================================
-- 5. PERFORMANCE ANALYSIS
-- ========================================

-- Check current indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'
ORDER BY indexname;

-- Check table size and statistics
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as bytes,
    n_live_tup as live_rows
FROM pg_stat_user_tables 
WHERE tablename = 'IngredientCategorized';

-- ========================================
-- 6. RECIPE INGREDIENT ANALYSIS
-- ========================================

-- Check recipe ingredient patterns
SELECT 
    r.title as recipe_title,
    ri.ingredient_name,
    ri.amount,
    ri.unit
FROM "Recipes" r
JOIN "RecipeIngredients" ri ON r.id = ri.recipe_id
WHERE ri.ingredient_name ILIKE '%milk%'
   OR ri.ingredient_name ILIKE '%gluten%'
   OR ri.ingredient_name ILIKE '%peanut%'
LIMIT 10;

-- Count recipes with allergen-containing ingredients
SELECT 
    COUNT(DISTINCT r.id) as recipes_with_allergens,
    COUNT(DISTINCT ri.recipe_id) as recipes_with_ingredients
FROM "Recipes" r
LEFT JOIN "RecipeIngredients" ri ON r.id = ri.recipe_id
WHERE ri.ingredient_name ILIKE '%milk%'
   OR ri.ingredient_name ILIKE '%gluten%'
   OR ri.ingredient_name ILIKE '%peanut%'; 