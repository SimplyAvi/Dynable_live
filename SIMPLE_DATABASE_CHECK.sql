-- 🎯 SIMPLE DATABASE CHECK SCRIPT
-- This script avoids any ambiguous column references and provides clear results

-- ========================================
-- STEP 1: CHECK IF SPECIFIC TABLES EXIST
-- ========================================

-- Check IngredientCategorized
SELECT 
    'IngredientCategorized' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'IngredientCategorized' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check SearchPreferences
SELECT 
    'SearchPreferences' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SearchPreferences' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check AllergenDerivatives
SELECT 
    'AllergenDerivatives' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'AllergenDerivatives' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check IngredientAllergens
SELECT 
    'IngredientAllergens' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'IngredientAllergens' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check CanonicalIngredients
SELECT 
    'CanonicalIngredients' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'CanonicalIngredients' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check UserHistories
SELECT 
    'UserHistories' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'UserHistories' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check Food (in case it exists)
SELECT 
    'Food' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Food' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- ========================================
-- STEP 2: LIST ALL TABLES WITH KEYWORDS
-- ========================================

-- Tables with 'allergen' in name
SELECT 
    'ALLERGEN TABLES' as category,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%allergen%'
ORDER BY table_name;

-- Tables with 'ingredient' in name
SELECT 
    'INGREDIENT TABLES' as category,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%ingredient%'
ORDER BY table_name;

-- Tables with 'search' in name
SELECT 
    'SEARCH TABLES' as category,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%search%'
ORDER BY table_name;

-- Tables with 'user' in name
SELECT 
    'USER TABLES' as category,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%user%'
ORDER BY table_name;

-- ========================================
-- STEP 3: CHECK ALLERGEN COLUMNS
-- ========================================

-- Find all columns with 'allergen' in the name
SELECT 
    'ALLERGEN COLUMNS' as category,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND column_name ILIKE '%allergen%'
ORDER BY table_name, column_name;

-- Find all columns with 'selected' in the name
SELECT 
    'SELECTED COLUMNS' as category,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND column_name ILIKE '%selected%'
ORDER BY table_name, column_name;

-- ========================================
-- STEP 4: SUMMARY
-- ========================================

SELECT 
    'SUMMARY' as category,
    'Run this script to verify database structure' as note,
    'Check results above to identify existing tables and columns' as action; 