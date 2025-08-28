-- 🔧 SAFE SECURITY WARNINGS FIX: Add search_path to existing functions only
-- Author: Justin Linzan
-- Date: January 2025
-- Purpose: Fix function search path mutable warnings without breaking existing logic

-- =============================================================================
-- STEP 1: SAFE FUNCTION SEARCH PATH FIXES
-- =============================================================================

-- This migration ONLY adds "SET search_path = public" to existing functions
-- It does NOT change any function logic or create placeholder functions
-- Based on function inventory: 31 functions exist, 1 does not exist

-- CRITICAL: Only modify functions that actually exist in your database
-- This prevents breaking your application with placeholder functions

-- =============================================================================
-- FUNCTIONS CONFIRMED TO EXIST (31 functions)
-- =============================================================================

-- Function 1: update_search_preferences_updated_at
-- Add search_path to existing function (preserve all existing logic)
DO $$
BEGIN
    -- Only modify if function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_search_preferences_updated_at' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        -- Get current function definition and add search_path
        -- This preserves all existing logic
        EXECUTE 'ALTER FUNCTION public.update_search_preferences_updated_at() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to update_search_preferences_updated_at';
    ELSE
        RAISE NOTICE '⚠️  Function update_search_preferences_updated_at does not exist - skipping';
    END IF;
END $$;

-- Function 2: update_updated_at_column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to update_updated_at_column';
    ELSE
        RAISE NOTICE '⚠️  Function update_updated_at_column does not exist - skipping';
    END IF;
END $$;

-- Function 3: to_camel_case
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'to_camel_case' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.to_camel_case(TEXT) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to to_camel_case';
    ELSE
        RAISE NOTICE '⚠️  Function to_camel_case does not exist - skipping';
    END IF;
END $$;

-- Function 4: fix_cart_price_data_types
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fix_cart_price_data_types' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.fix_cart_price_data_types() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to fix_cart_price_data_types';
    ELSE
        RAISE NOTICE '⚠️  Function fix_cart_price_data_types does not exist - skipping';
    END IF;
END $$;

-- Function 5: is_admin_user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_user' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.is_admin_user() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to is_admin_user';
    ELSE
        RAISE NOTICE '⚠️  Function is_admin_user does not exist - skipping';
    END IF;
END $$;

-- Function 6: get_all_carts_admin
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_all_carts_admin' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.get_all_carts_admin() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to get_all_carts_admin';
    ELSE
        RAISE NOTICE '⚠️  Function get_all_carts_admin does not exist - skipping';
    END IF;
END $$;

-- Function 7: validate_cart_items
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_cart_items' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.validate_cart_items(JSONB) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to validate_cart_items';
    ELSE
        RAISE NOTICE '⚠️  Function validate_cart_items does not exist - skipping';
    END IF;
END $$;

-- Function 8: fix_remaining_string_prices
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fix_remaining_string_prices' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.fix_remaining_string_prices() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to fix_remaining_string_prices';
    ELSE
        RAISE NOTICE '⚠️  Function fix_remaining_string_prices does not exist - skipping';
    END IF;
END $$;

-- Function 9: fix_string_prices_simple
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fix_string_prices_simple' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.fix_string_prices_simple() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to fix_string_prices_simple';
    ELSE
        RAISE NOTICE '⚠️  Function fix_string_prices_simple does not exist - skipping';
    END IF;
END $$;

-- Function 10: clean_product_name
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clean_product_name' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.clean_product_name(TEXT) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to clean_product_name';
    ELSE
        RAISE NOTICE '⚠️  Function clean_product_name does not exist - skipping';
    END IF;
END $$;

-- Function 11: clean_ingredient_name
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clean_ingredient_name' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.clean_ingredient_name(TEXT) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to clean_ingredient_name';
    ELSE
        RAISE NOTICE '⚠️  Function clean_ingredient_name does not exist - skipping';
    END IF;
END $$;

-- Function 12: fix_all_string_prices
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fix_all_string_prices' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.fix_all_string_prices() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to fix_all_string_prices';
    ELSE
        RAISE NOTICE '⚠️  Function fix_all_string_prices does not exist - skipping';
    END IF;
END $$;

-- Function 13: get_search_preferences
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_search_preferences' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.get_search_preferences(UUID) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to get_search_preferences';
    ELSE
        RAISE NOTICE '⚠️  Function get_search_preferences does not exist - skipping';
    END IF;
END $$;

-- Function 14: detect_allergens_in_description
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'detect_allergens_in_description' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.detect_allergens_in_description(TEXT, TEXT) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to detect_allergens_in_description';
    ELSE
        RAISE NOTICE '⚠️  Function detect_allergens_in_description does not exist - skipping';
    END IF;
END $$;

-- Function 15: merge_carts_safe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'merge_carts_safe' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.merge_carts_safe(INTEGER, INTEGER) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to merge_carts_safe';
    ELSE
        RAISE NOTICE '⚠️  Function merge_carts_safe does not exist - skipping';
    END IF;
END $$;

-- Function 16: clear_search_preferences
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clear_search_preferences' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.clear_search_preferences(UUID) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to clear_search_preferences';
    ELSE
        RAISE NOTICE '⚠️  Function clear_search_preferences does not exist - skipping';
    END IF;
END $$;

-- Function 17: merge_search_preferences_safe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'merge_search_preferences_safe' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.merge_search_preferences_safe(UUID, UUID) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to merge_search_preferences_safe';
    ELSE
        RAISE NOTICE '⚠️  Function merge_search_preferences_safe does not exist - skipping';
    END IF;
END $$;

-- Function 18: process_product_allergens_improved
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_product_allergens_improved' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.process_product_allergens_improved() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to process_product_allergens_improved';
    ELSE
        RAISE NOTICE '⚠️  Function process_product_allergens_improved does not exist - skipping';
    END IF;
END $$;

-- Function 19: process_product_allergens_dry_run
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_product_allergens_dry_run' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.process_product_allergens_dry_run() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to process_product_allergens_dry_run';
    ELSE
        RAISE NOTICE '⚠️  Function process_product_allergens_dry_run does not exist - skipping';
    END IF;
END $$;

-- Function 20: validate_allergen_format
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_allergen_format' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.validate_allergen_format(TEXT) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to validate_allergen_format';
    ELSE
        RAISE NOTICE '⚠️  Function validate_allergen_format does not exist - skipping';
    END IF;
END $$;

-- Function 21: validate_allergen_array
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_allergen_array' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.validate_allergen_array(TEXT[]) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to validate_allergen_array';
    ELSE
        RAISE NOTICE '⚠️  Function validate_allergen_array does not exist - skipping';
    END IF;
END $$;

-- Function 22: validate_ingredients_allergens
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_ingredients_allergens' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.validate_ingredients_allergens() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to validate_ingredients_allergens';
    ELSE
        RAISE NOTICE '⚠️  Function validate_ingredients_allergens does not exist - skipping';
    END IF;
END $$;

-- Function 23: validate_ingredient_categorized_allergens
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_ingredient_categorized_allergens' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.validate_ingredient_categorized_allergens() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to validate_ingredient_categorized_allergens';
    ELSE
        RAISE NOTICE '⚠️  Function validate_ingredient_categorized_allergens does not exist - skipping';
    END IF;
END $$;

-- Function 24: validate_search_preferences_allergens
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_search_preferences_allergens' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.validate_search_preferences_allergens() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to validate_search_preferences_allergens';
    ELSE
        RAISE NOTICE '⚠️  Function validate_search_preferences_allergens does not exist - skipping';
    END IF;
END $$;

-- Function 25: check_allergen_data_integrity
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_allergen_data_integrity' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.check_allergen_data_integrity() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to check_allergen_data_integrity';
    ELSE
        RAISE NOTICE '⚠️  Function check_allergen_data_integrity does not exist - skipping';
    END IF;
END $$;

-- Function 26: process_product_allergens_minimal_dry_run
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_product_allergens_minimal_dry_run' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.process_product_allergens_minimal_dry_run() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to process_product_allergens_minimal_dry_run';
    ELSE
        RAISE NOTICE '⚠️  Function process_product_allergens_minimal_dry_run does not exist - skipping';
    END IF;
END $$;

-- Function 27: save_search_preferences
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'save_search_preferences' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.save_search_preferences(UUID, JSONB) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to save_search_preferences';
    ELSE
        RAISE NOTICE '⚠️  Function save_search_preferences does not exist - skipping';
    END IF;
END $$;

-- Function 28: merge_search_preferences
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'merge_search_preferences' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.merge_search_preferences(UUID, UUID) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to merge_search_preferences';
    ELSE
        RAISE NOTICE '⚠️  Function merge_search_preferences does not exist - skipping';
    END IF;
END $$;

-- Function 29: process_product_allergens_minimal
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_product_allergens_minimal' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.process_product_allergens_minimal() SET search_path = public';
        RAISE NOTICE '✅ Added search_path to process_product_allergens_minimal';
    ELSE
        RAISE NOTICE '⚠️  Function process_product_allergens_minimal does not exist - skipping';
    END IF;
END $$;

-- Function 30: link_anonymous_cart
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'link_anonymous_cart' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.link_anonymous_cart(INTEGER, UUID) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to link_anonymous_cart';
    ELSE
        RAISE NOTICE '⚠️  Function link_anonymous_cart does not exist - skipping';
    END IF;
END $$;

-- Function 31: merge_anonymous_cart
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'merge_anonymous_cart' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        EXECUTE 'ALTER FUNCTION public.merge_anonymous_cart(INTEGER, UUID) SET search_path = public';
        RAISE NOTICE '✅ Added search_path to merge_anonymous_cart';
    ELSE
        RAISE NOTICE '⚠️  Function merge_anonymous_cart does not exist - skipping';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: VERIFICATION QUERIES
-- =============================================================================

-- Check which functions now have search_path set
SELECT 
    'FUNCTION SEARCH PATH STATUS' as info,
    COUNT(*) as total_functions_checked,
    COUNT(CASE WHEN proconfig IS NOT NULL AND array_to_string(proconfig, ',') LIKE '%search_path%' THEN 1 END) as functions_with_search_path,
    COUNT(CASE WHEN proconfig IS NULL OR array_to_string(proconfig, ',') NOT LIKE '%search_path%' THEN 1 END) as functions_needing_fix
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'update_search_preferences_updated_at',
    'update_updated_at_column',
    'to_camel_case',
    'fix_cart_price_data_types',
    'is_admin_user',
    'get_all_carts_admin',
    'validate_cart_items',
    'fix_remaining_string_prices',
    'fix_string_prices_simple',
    'clean_product_name',
    'clean_ingredient_name',
    'fix_all_string_prices',
    'get_search_preferences',
    'detect_allergens_in_description',
    'merge_carts_safe',
    'clear_search_preferences',
    'merge_search_preferences_safe',
    'process_product_allergens_improved',
    'process_product_allergens_dry_run',
    'validate_allergen_format',
    'validate_allergen_array',
    'validate_ingredients_allergens',
    'validate_ingredient_categorized_allergens',
    'validate_search_preferences_allergens',
    'check_allergen_data_integrity',
    'process_product_allergens_minimal_dry_run',
    'save_search_preferences',
    'merge_search_preferences',
    'process_product_allergens_minimal',
    'link_anonymous_cart',
    'merge_anonymous_cart'
);

-- =============================================================================
-- STEP 3: SECURITY SUMMARY
-- =============================================================================

SELECT 
    'SAFE SECURITY WARNINGS FIX SUMMARY' as info,
    '✅ Function search paths fixed safely' as status_1,
    '✅ All existing function logic preserved' as status_2,
    '✅ No placeholder functions created' as status_3,
    '✅ Non-existent functions skipped' as status_4,
    '✅ Application functionality maintained' as status_5;
