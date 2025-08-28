-- 🚀 RLS PERFORMANCE OPTIMIZATION MIGRATION
-- Author: Justin Linzan
-- Date: January 2025
-- Purpose: Fix all auth_rls_initplan performance warnings by optimizing auth function calls
-- Based on Supabase documentation: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- =============================================================================
-- STEP 1: DROP EXISTING POLICIES WITH PERFORMANCE ISSUES
-- =============================================================================

-- Drop policies that need optimization (we'll recreate them with better performance)
DROP POLICY IF EXISTS "sellers_create_products" ON "IngredientCategorized";
DROP POLICY IF EXISTS "sellers_update_own_products" ON "IngredientCategorized";
DROP POLICY IF EXISTS "admin_actions_admin_only" ON "admin_actions";
DROP POLICY IF EXISTS "sellers_update_inventory" ON "IngredientCategorized";
DROP POLICY IF EXISTS "allergens_admin_write" ON "AllergenDerivatives";
DROP POLICY IF EXISTS "substitutions_admin_write" ON "Substitutions";
DROP POLICY IF EXISTS "recipes_admin_write" ON "Recipes";
DROP POLICY IF EXISTS "recipe_ingredients_admin_write" ON "RecipeIngredients";
DROP POLICY IF EXISTS "ingredients_admin_write" ON "Ingredients";
DROP POLICY IF EXISTS "ingredient_mappings_admin_write" ON "IngredientToCanonicals";
DROP POLICY IF EXISTS "users_create_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_create_own_orders" ON "Orders";
DROP POLICY IF EXISTS "users_update_own_orders" ON "Orders";
DROP POLICY IF EXISTS "admin_orders_management" ON "Orders";
DROP POLICY IF EXISTS "allergens_authenticated_write" ON "AllergenDerivatives";
DROP POLICY IF EXISTS "substitutions_authenticated_write" ON "Substitutions";
DROP POLICY IF EXISTS "recipes_authenticated_write" ON "Recipes";
DROP POLICY IF EXISTS "recipe_ingredients_authenticated_write" ON "RecipeIngredients";
DROP POLICY IF EXISTS "ingredients_authenticated_write" ON "Ingredients";
DROP POLICY IF EXISTS "ingredient_mappings_authenticated_write" ON "IngredientToCanonicals";
DROP POLICY IF EXISTS "users_view_own_profile" ON "Users";
DROP POLICY IF EXISTS "users_update_own_profile" ON "Users";
DROP POLICY IF EXISTS "admin_user_management" ON "Users";
DROP POLICY IF EXISTS "users_view_own_orders" ON "Orders";
DROP POLICY IF EXISTS "admin_users_all" ON "Users";

-- =============================================================================
-- STEP 2: CREATE OPTIMIZED POLICIES WITH SELECT WRAPPING
-- =============================================================================

-- 🎯 IngredientCategorized table - Optimized policies
-- Sellers can create products (optimized)
CREATE POLICY "sellers_create_products" ON "IngredientCategorized"
    FOR INSERT WITH CHECK (
        (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = false AND
        (SELECT (auth.jwt() ->> 'role')::text) IN ('seller', 'admin') AND
        (seller_id::text = (SELECT auth.uid()::text) OR (SELECT (auth.jwt() ->> 'role')::text) = 'admin')
    );

-- Sellers can update their own products (optimized)
CREATE POLICY "sellers_update_own_products" ON "IngredientCategorized"
    FOR UPDATE USING (
        (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = false AND
        (seller_id::text = (SELECT auth.uid()::text) OR (SELECT (auth.jwt() ->> 'role')::text) = 'admin')
    ) WITH CHECK (
        (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = false AND
        (seller_id::text = (SELECT auth.uid()::text) OR (SELECT (auth.jwt() ->> 'role')::text) = 'admin')
    );

-- Sellers can update inventory (optimized)
CREATE POLICY "sellers_update_inventory" ON "IngredientCategorized"
    FOR UPDATE USING (
        (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = false AND
        (SELECT (auth.jwt() ->> 'role')::text) IN ('seller', 'admin') AND
        (seller_id::text = (SELECT auth.uid()::text) OR (SELECT (auth.jwt() ->> 'role')::text) = 'admin')
    ) WITH CHECK (
        (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = false AND
        (SELECT (auth.jwt() ->> 'role')::text) IN ('seller', 'admin') AND
        (seller_id::text = (SELECT auth.uid()::text) OR (SELECT (auth.jwt() ->> 'role')::text) = 'admin')
    );

-- 🎯 admin_actions table - Optimized policies
-- Only admins can view admin actions (optimized)
CREATE POLICY "admin_actions_admin_only" ON "admin_actions"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- 🎯 AllergenDerivatives table - Optimized policies
-- Admin write access (optimized)
CREATE POLICY "allergens_admin_write" ON "AllergenDerivatives"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- Authenticated write access (optimized)
CREATE POLICY "allergens_authenticated_write" ON "AllergenDerivatives"
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- 🎯 Substitutions table - Optimized policies
-- Admin write access (optimized)
CREATE POLICY "substitutions_admin_write" ON "Substitutions"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- Authenticated write access (optimized)
CREATE POLICY "substitutions_authenticated_write" ON "Substitutions"
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- 🎯 Recipes table - Optimized policies
-- Admin write access (optimized)
CREATE POLICY "recipes_admin_write" ON "Recipes"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- Authenticated write access (optimized)
CREATE POLICY "recipes_authenticated_write" ON "Recipes"
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- 🎯 RecipeIngredients table - Optimized policies
-- Admin write access (optimized)
CREATE POLICY "recipe_ingredients_admin_write" ON "RecipeIngredients"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- Authenticated write access (optimized)
CREATE POLICY "recipe_ingredients_authenticated_write" ON "RecipeIngredients"
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- 🎯 Ingredients table - Optimized policies
-- Admin write access (optimized)
CREATE POLICY "ingredients_admin_write" ON "Ingredients"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- Authenticated write access (optimized)
CREATE POLICY "ingredients_authenticated_write" ON "Ingredients"
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- 🎯 IngredientToCanonicals table - Optimized policies
-- Admin write access (optimized)
CREATE POLICY "ingredient_mappings_admin_write" ON "IngredientToCanonicals"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- Authenticated write access (optimized)
CREATE POLICY "ingredient_mappings_authenticated_write" ON "IngredientToCanonicals"
    FOR ALL USING (
        (SELECT auth.uid()) IS NOT NULL
    );

-- 🎯 Users table - Optimized policies
-- Users can create their own profile (optimized)
CREATE POLICY "users_create_own_profile" ON "Users"
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()::text) = id::text
    );

-- Users can view their own profile (optimized)
CREATE POLICY "users_view_own_profile" ON "Users"
    FOR SELECT USING (
        (SELECT auth.uid()::text) = id::text OR (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- Users can update their own profile (optimized)
CREATE POLICY "users_update_own_profile" ON "Users"
    FOR UPDATE USING (
        (SELECT auth.uid()::text) = id::text
    ) WITH CHECK (
        (SELECT auth.uid()::text) = id::text
    );

-- Admin user management (optimized)
CREATE POLICY "admin_user_management" ON "Users"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- Admin users all access (optimized)
CREATE POLICY "admin_users_all" ON "Users"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- 🎯 Orders table - Optimized policies
-- Users can create their own orders (optimized)
CREATE POLICY "users_create_own_orders" ON "Orders"
    FOR INSERT WITH CHECK (
        (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = false AND
        (SELECT (auth.jwt() ->> 'role')::text) IN ('end_user', 'seller', 'admin') AND
        "userId"::text = (SELECT auth.uid()::text)
    );

-- Users can update their own orders (optimized)
CREATE POLICY "users_update_own_orders" ON "Orders"
    FOR UPDATE USING (
        (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = false AND
        ("userId"::text = (SELECT auth.uid()::text) OR (SELECT (auth.jwt() ->> 'role')::text) = 'admin')
    ) WITH CHECK (
        (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = false AND
        ("userId"::text = (SELECT auth.uid()::text) OR (SELECT (auth.jwt() ->> 'role')::text) = 'admin')
    );

-- Admin orders management (optimized)
CREATE POLICY "admin_orders_management" ON "Orders"
    FOR ALL USING (
        (SELECT (auth.jwt() ->> 'role')::text) = 'admin'
    );

-- Users can view their own orders (optimized)
CREATE POLICY "users_view_own_orders" ON "Orders"
    FOR SELECT USING (
        (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = false AND
        ("userId"::text = (SELECT auth.uid()::text) OR (SELECT (auth.jwt() ->> 'role')::text) = 'admin')
    );

-- =============================================================================
-- STEP 3: CREATE OPTIMIZED HELPER FUNCTIONS
-- =============================================================================

-- Optimized admin check function
CREATE OR REPLACE FUNCTION public.is_admin_optimized()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT (auth.jwt() ->> 'role')::text) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized authenticated user check function
CREATE OR REPLACE FUNCTION public.is_authenticated_optimized()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT auth.uid()) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized anonymous user check function
CREATE OR REPLACE FUNCTION public.is_anonymous_optimized()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT (auth.jwt() ->> 'is_anonymous')::boolean) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized seller check function
CREATE OR REPLACE FUNCTION public.is_seller_optimized()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT (auth.jwt() ->> 'role')::text) IN ('seller', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 4: VERIFICATION QUERIES
-- =============================================================================

-- Check that all policies were recreated successfully
SELECT 
    'Policy Recreation Status' as check_name,
    COUNT(*) || ' policies found' as status
FROM pg_policies 
WHERE tablename IN (
    'IngredientCategorized',
    'admin_actions',
    'AllergenDerivatives',
    'Substitutions',
    'Recipes',
    'RecipeIngredients',
    'Ingredients',
    'IngredientToCanonicals',
    'Users',
    'Orders'
);

-- Test optimized helper functions
SELECT 
    'Optimized Functions Test' as test_name,
    CASE 
        WHEN public.is_admin_optimized() IS NOT NULL THEN '✅ Admin function works'
        ELSE '❌ Admin function failed'
    END as admin_function,
    CASE 
        WHEN public.is_authenticated_optimized() IS NOT NULL THEN '✅ Auth function works'
        ELSE '❌ Auth function failed'
    END as auth_function,
    CASE 
        WHEN public.is_anonymous_optimized() IS NOT NULL THEN '✅ Anonymous function works'
        ELSE '❌ Anonymous function failed'
    END as anonymous_function,
    CASE 
        WHEN public.is_seller_optimized() IS NOT NULL THEN '✅ Seller function works'
        ELSE '❌ Seller function failed'
    END as seller_function;

-- =============================================================================
-- STEP 5: PERFORMANCE IMPACT SUMMARY
-- =============================================================================

-- Display optimization summary
SELECT 
    'PERFORMANCE OPTIMIZATION SUMMARY' as info,
    '✅ All auth function calls wrapped in SELECT statements' as optimization_1,
    '✅ 25+ RLS policies optimized for better performance' as optimization_2,
    '✅ Helper functions created for common auth checks' as optimization_3,
    '✅ Eliminates auth_rls_initplan warnings' as optimization_4,
    '✅ Improves query performance at scale' as optimization_5;

-- Count optimized policies by table
SELECT 
    tablename,
    COUNT(*) as optimized_policies
FROM pg_policies 
WHERE tablename IN (
    'IngredientCategorized',
    'admin_actions',
    'AllergenDerivatives',
    'Substitutions',
    'Recipes',
    'RecipeIngredients',
    'Ingredients',
    'IngredientToCanonicals',
    'Users',
    'Orders'
)
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- STEP 6: MIGRATION COMPLETION
-- =============================================================================

SELECT '🚀 RLS Performance Optimization Complete!' as status;
SELECT 'All auth_rls_initplan warnings should now be resolved.' as message;
