-- 🚀 CRITICAL: Add Recipe Performance Indexes
-- Run this in your Supabase SQL Editor to fix the timeout issues
-- Author: Justin Linzan
-- Date: January 2025

-- =============================================================================
-- RECIPE INGREDIENTS PERFORMANCE INDEXES (MOST CRITICAL)
-- =============================================================================

-- 🚨 CRITICAL: This index prevents the "canceling statement due to statement timeout" error
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id 
ON "RecipeIngredients" ("RecipeId");

-- 🚀 ADDED: Composite index for recipe + ingredient lookups
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_name 
ON "RecipeIngredients" ("RecipeId", "name");

-- 🚀 ADDED: Index on ingredient names for faster text searches
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name 
ON "RecipeIngredients" USING gin(to_tsvector('english', "name"));

-- =============================================================================
-- RECIPES TABLE PERFORMANCE INDEXES
-- =============================================================================

-- 🚀 ADDED: Index on recipe ID for fast lookups
CREATE INDEX IF NOT EXISTS idx_recipes_id 
ON "Recipes" ("id");

-- 🚀 ADDED: Index on recipe title for search functionality
CREATE INDEX IF NOT EXISTS idx_recipes_title 
ON "Recipes" USING gin(to_tsvector('english', "title"));

-- =============================================================================
-- INGREDIENT CATEGORIZED PERFORMANCE INDEXES
-- =============================================================================

-- 🚀 ADDED: Index on description for faster ingredient matching
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_description 
ON "IngredientCategorized" USING gin(to_tsvector('english', "description"));

-- 🚀 ADDED: Index on canonicalTag for faster canonical matching
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_canonical_tag 
ON "IngredientCategorized" ("canonicalTag");

-- 🚀 ADDED: Index on allergens array for faster allergen filtering
CREATE INDEX IF NOT EXISTS idx_ingredient_categorized_allergens 
ON "IngredientCategorized" USING GIN ("allergens");

-- =============================================================================
-- SUBSTITUTE MAPPINGS PERFORMANCE INDEXES
-- =============================================================================

-- 🚀 ADDED: Index on original product canonical for faster substitute lookups
CREATE INDEX IF NOT EXISTS idx_substitute_mappings_original 
ON "SubstituteMappings" ("original_product_canonical");

-- 🚀 ADDED: Index on substitute product canonical for reverse lookups
CREATE INDEX IF NOT EXISTS idx_substitute_mappings_substitute 
ON "SubstituteMappings" ("substitute_product_canonical");

-- =============================================================================
-- INGREDIENT CANONICAL PERFORMANCE INDEXES
-- =============================================================================

-- 🚀 ADDED: Index on canonical ingredient for faster ingredient matching
CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_name 
ON "IngredientCanonical" ("canonical_ingredient");

-- 🚀 ADDED: Index on matching products array for faster product lookups
CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_products 
ON "IngredientCanonical" USING GIN ("matching_products");

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check if indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN (
    'RecipeIngredients',
    'Recipes', 
    'IngredientCategorized',
    'SubstituteMappings',
    'IngredientCanonical'
)
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

