-- 🎯 FOCUSED DATABASE CHECK SCRIPT
-- Based on partial results, let's get the complete database structure

-- ========================================
-- STEP 1: CHECK ALL TABLES IN DATABASE
-- ========================================

-- Get complete list of all tables
SELECT 
    'ALL TABLES IN DATABASE' as category,
    table_name,
    'Table exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ========================================
-- STEP 2: CHECK SPECIFIC TABLES WE EXPECT
-- ========================================

-- Check IngredientCategorized (main products table)
SELECT 
    'IngredientCategorized' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'IngredientCategorized' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check SearchPreferences (user preferences)
SELECT 
    'SearchPreferences' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'SearchPreferences' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check AllergenDerivatives (allergen mappings)
SELECT 
    'AllergenDerivatives' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'AllergenDerivatives' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check CanonicalIngredients (ingredient reference)
SELECT 
    'CanonicalIngredients' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'CanonicalIngredients' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check UserHistories (user search history)
SELECT 
    'UserHistories' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'UserHistories' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check Food (original table name)
SELECT 
    'Food' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'Food' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- ========================================
-- STEP 3: CHECK FOR ALLERGEN-RELATED TABLES
-- ========================================

-- Find any tables with 'allergen' in the name
SELECT 
    'ALLERGEN TABLES' as category,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%allergen%'
ORDER BY table_name;

-- Find any tables with 'ingredient' in the name
SELECT 
    'INGREDIENT TABLES' as category,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%ingredient%'
ORDER BY table_name;

-- Find any tables with 'search' in the name
SELECT 
    'SEARCH TABLES' as category,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%search%'
ORDER BY table_name;

-- ========================================
-- STEP 4: CHECK FOR ALLERGEN COLUMNS
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
-- STEP 5: CHECK USERS TABLE STRUCTURE
-- ========================================

-- Since we know Users table exists, let's check its structure
SELECT 
    'USERS TABLE COLUMNS' as category,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- STEP 6: SUMMARY
-- ========================================

SELECT 
    'SUMMARY' as category,
    'Database structure analysis complete' as note,
    'Use results to update migration scripts' as action; 