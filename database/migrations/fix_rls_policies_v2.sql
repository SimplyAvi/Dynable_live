-- Fix RLS Policies for Missing Tables (Version 2)
-- This migration adds RLS policies for tables that don't have them
-- Uses proper Supabase role checking approach

-- 1. Enable RLS on missing tables
ALTER TABLE "AllergenDerivatives" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Substitutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecipeIngredients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ingredients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IngredientToCanonicals" ENABLE ROW LEVEL SECURITY;

-- 2. AllergenDerivatives policies (public read, authenticated admin write)
-- This fixes the "only seeing 10 allergies" issue
CREATE POLICY "allergens_public_read" ON "AllergenDerivatives"
    FOR SELECT USING (true);  -- Everyone can read allergens

CREATE POLICY "allergens_admin_write" ON "AllergenDerivatives"
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 3. Substitutions policies (public read, authenticated admin write)
CREATE POLICY "substitutions_public_read" ON "Substitutions"
    FOR SELECT USING (true);  -- Everyone can read substitutions

CREATE POLICY "substitutions_admin_write" ON "Substitutions"
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 4. Recipes policies (public read, authenticated admin write)
CREATE POLICY "recipes_public_read" ON "Recipes"
    FOR SELECT USING (true);  -- Everyone can read recipes

CREATE POLICY "recipes_admin_write" ON "Recipes"
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 5. RecipeIngredients policies (public read, authenticated admin write)
CREATE POLICY "recipe_ingredients_public_read" ON "RecipeIngredients"
    FOR SELECT USING (true);  -- Everyone can read recipe ingredients

CREATE POLICY "recipe_ingredients_admin_write" ON "RecipeIngredients"
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 6. Ingredients policies (public read, authenticated admin write)
CREATE POLICY "ingredients_public_read" ON "Ingredients"
    FOR SELECT USING (true);  -- Everyone can read ingredients

CREATE POLICY "ingredients_admin_write" ON "Ingredients"
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 7. IngredientToCanonicals policies (public read, authenticated admin write)
CREATE POLICY "ingredient_mappings_public_read" ON "IngredientToCanonicals"
    FOR SELECT USING (true);  -- Everyone can read mappings

CREATE POLICY "ingredient_mappings_admin_write" ON "IngredientToCanonicals"
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 8. Update existing policies to use proper role checking
-- Update Users policies
DROP POLICY IF EXISTS "admin_users_all" ON "Users";
CREATE POLICY "admin_users_all" ON "Users"
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- Update IngredientCategorized policies
DROP POLICY IF EXISTS "products_public_read" ON "IngredientCategorized";
CREATE POLICY "products_public_read" ON "IngredientCategorized"
    FOR SELECT USING (
        is_active = true OR
        (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role')::text = 'admin')
    );

-- Update Carts policies
DROP POLICY IF EXISTS "users_own_cart" ON "Carts";
CREATE POLICY "users_own_cart" ON "Carts"
    FOR ALL USING (
        "userId"::text = auth.uid()::text OR
        (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role')::text = 'admin')
    );

-- 9. Verification queries to test the policies
-- Check if RLS is enabled on all tables
SELECT 
    'RLS Status Check' as check_name,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE tablename IN ('Users', 'Carts', 'Orders', 'IngredientCategorized', 'admin_actions', 'AllergenDerivatives', 'Substitutions', 'Recipes', 'RecipeIngredients', 'Ingredients', 'IngredientToCanonicals')
ORDER BY tablename;

-- Check all policies on key tables
SELECT 
    'Policy Count Check' as check_name,
    tablename,
    COUNT(*) || ' policies' as policy_count
FROM pg_policies 
WHERE tablename IN ('Users', 'Carts', 'Orders', 'IngredientCategorized', 'admin_actions', 'AllergenDerivatives', 'Substitutions', 'Recipes', 'RecipeIngredients', 'Ingredients', 'IngredientToCanonicals')
GROUP BY tablename
ORDER BY tablename;

-- Test allergen access (should return all allergens)
SELECT 
    'Allergen Access Test' as test_name,
    COUNT(*) || ' allergens available' as result
FROM "AllergenDerivatives";

-- Test recipe access (should return all recipes)
SELECT 
    'Recipe Access Test' as test_name,
    COUNT(*) || ' recipes available' as result
FROM "Recipes"; 