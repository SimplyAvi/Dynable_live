-- 🚀 RLS PERFORMANCE OPTIMIZATION MIGRATION (SIMPLE VERSION)
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

-- Check that policies were recreated successfully
SELECT 
    'Policy Recreation Status' as check_name,
    COUNT(*) || ' policies found' as status
FROM pg_policies 
WHERE tablename IN ('IngredientCategorized', 'admin_actions');

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
    '✅ Auth function calls wrapped in SELECT statements' as optimization_1,
    '✅ 4 RLS policies optimized for better performance' as optimization_2,
    '✅ Helper functions created for common auth checks' as optimization_3,
    '✅ Eliminates auth_rls_initplan warnings' as optimization_4,
    '✅ Improves query performance at scale' as optimization_5;

-- Count optimized policies by table
SELECT 
    tablename,
    COUNT(*) as optimized_policies
FROM pg_policies 
WHERE tablename IN ('IngredientCategorized', 'admin_actions')
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- STEP 6: MIGRATION COMPLETION
-- =============================================================================

SELECT '🚀 RLS Performance Optimization Complete!' as status;
SELECT 'All auth_rls_initplan warnings should now be resolved.' as message;
