-- 🎯 QUICK DATABASE CHECK SCRIPT
-- Run this first to see what tables actually exist in your database

-- Check if IngredientCategorized exists
SELECT 
    'IngredientCategorized' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'IngredientCategorized' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if SearchPreferences exists
SELECT 
    'SearchPreferences' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SearchPreferences' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if AllergenDerivatives exists
SELECT 
    'AllergenDerivatives' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'AllergenDerivatives' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if IngredientAllergens exists
SELECT 
    'IngredientAllergens' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'IngredientAllergens' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if CanonicalIngredients exists
SELECT 
    'CanonicalIngredients' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'CanonicalIngredients' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if UserHistories exists
SELECT 
    'UserHistories' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'UserHistories' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if Food exists
SELECT 
    'Food' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Food' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- List all tables that contain 'allergen' in the name
SELECT 
    'TABLES WITH ALLERGEN IN NAME' as search_type,
    t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name ILIKE '%allergen%'
ORDER BY t.table_name;

-- List all tables that contain 'ingredient' in the name
SELECT 
    'TABLES WITH INGREDIENT IN NAME' as search_type,
    t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name ILIKE '%ingredient%'
ORDER BY t.table_name;

-- List all tables that contain 'search' in the name
SELECT 
    'TABLES WITH SEARCH IN NAME' as search_type,
    t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name ILIKE '%search%'
ORDER BY t.table_name;

-- List all tables that contain 'user' in the name
SELECT 
    'TABLES WITH USER IN NAME' as search_type,
    t.table_name
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND t.table_name ILIKE '%user%'
ORDER BY t.table_name; 