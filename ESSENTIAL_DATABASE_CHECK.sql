-- 🎯 ESSENTIAL DATABASE CHECK - SIMPLE AND CLEAR
-- This script will give us the exact database structure we need

-- ========================================
-- STEP 1: ALL TABLES IN DATABASE
-- ========================================

SELECT 'ALL TABLES' as category, table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ========================================
-- STEP 2: CHECK SPECIFIC TABLES WE NEED
-- ========================================

SELECT 'TABLE CHECK' as category, 
       'IngredientCategorized' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'IngredientCategorized') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'TABLE CHECK', 'SearchPreferences', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SearchPreferences') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE CHECK', 'AllergenDerivatives', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AllergenDerivatives') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE CHECK', 'CanonicalIngredients', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CanonicalIngredients') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE CHECK', 'UserHistories', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'UserHistories') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE CHECK', 'Food', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Food') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- ========================================
-- STEP 3: FIND ALLERGEN-RELATED TABLES
-- ========================================

SELECT 'ALLERGEN TABLES' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%allergen%'
ORDER BY table_name;

-- ========================================
-- STEP 4: FIND INGREDIENT-RELATED TABLES
-- ========================================

SELECT 'INGREDIENT TABLES' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%ingredient%'
ORDER BY table_name;

-- ========================================
-- STEP 5: FIND SEARCH-RELATED TABLES
-- ========================================

SELECT 'SEARCH TABLES' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%search%'
ORDER BY table_name;

-- ========================================
-- STEP 6: SUMMARY
-- ========================================

SELECT 'SUMMARY' as category, 
       'Essential database check complete' as note,
       'Check results above for table existence' as action; 