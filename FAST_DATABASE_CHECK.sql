-- 🚀 FAST DATABASE CHECK - OPTIMIZED FOR LARGE DATASETS
-- Strict limits to avoid timeouts with 100k+ products and 70k+ recipes

-- ========================================
-- STEP 1: QUICK TABLE EXISTENCE CHECK
-- ========================================

SELECT 'TABLE EXISTENCE' as category, 
       'IngredientCategorized' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'IngredientCategorized') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'TABLE EXISTENCE', 'SearchPreferences', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SearchPreferences') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE EXISTENCE', 'AllergenDerivatives', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AllergenDerivatives') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE EXISTENCE', 'CanonicalIngredients', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CanonicalIngredients') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE EXISTENCE', 'UserHistories', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'UserHistories') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'TABLE EXISTENCE', 'Food', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Food') 
            THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- ========================================
-- STEP 2: ALL TABLES (LIMITED TO 20)
-- ========================================

SELECT 'ALL TABLES (LIMITED)' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name 
LIMIT 20;

-- ========================================
-- STEP 3: ALLERGEN-RELATED TABLES
-- ========================================

SELECT 'ALLERGEN TABLES' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%allergen%'
ORDER BY table_name;

-- ========================================
-- STEP 4: INGREDIENT-RELATED TABLES
-- ========================================

SELECT 'INGREDIENT TABLES' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%ingredient%'
ORDER BY table_name;

-- ========================================
-- STEP 5: SEARCH-RELATED TABLES
-- ========================================

SELECT 'SEARCH TABLES' as category, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%search%'
ORDER BY table_name;

-- ========================================
-- STEP 6: COLUMN STRUCTURE (LIMITED SAMPLES)
-- ========================================

-- Check IngredientCategorized columns (if exists)
SELECT 'IngredientCategorized COLUMNS' as category, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'IngredientCategorized' AND table_schema = 'public'
ORDER BY ordinal_position
LIMIT 10;

-- Check SearchPreferences columns (if exists)
SELECT 'SearchPreferences COLUMNS' as category, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'SearchPreferences' AND table_schema = 'public'
ORDER BY ordinal_position
LIMIT 10;

-- Check AllergenDerivatives columns (if exists)
SELECT 'AllergenDerivatives COLUMNS' as category, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'AllergenDerivatives' AND table_schema = 'public'
ORDER BY ordinal_position
LIMIT 10;

-- ========================================
-- STEP 7: SAMPLE DATA (STRICT LIMITS)
-- ========================================

-- Sample from IngredientCategorized (if exists) - ONLY 3 ROWS
SELECT 'IngredientCategorized SAMPLE' as category, 
       id::text as sample_id,
       LEFT(description, 50) as sample_description,
       CASE WHEN allergens IS NOT NULL THEN 'Has allergens' ELSE 'No allergens' END as allergen_status
FROM "IngredientCategorized" 
LIMIT 3;

-- Sample from SearchPreferences (if exists) - ONLY 3 ROWS
SELECT 'SearchPreferences SAMPLE' as category, 
       id::text as sample_id,
       supabase_user_id::text as sample_user_id,
       CASE WHEN selected_allergens IS NOT NULL THEN 'Has allergens' ELSE 'No allergens' END as allergen_status
FROM "SearchPreferences" 
LIMIT 3;

-- Sample from AllergenDerivatives (if exists) - ONLY 3 ROWS
SELECT 'AllergenDerivatives SAMPLE' as category, 
       id::text as sample_id,
       allergen as sample_allergen,
       derivative as sample_derivative
FROM "AllergenDerivatives" 
LIMIT 3;

-- ========================================
-- STEP 8: ALLERGEN COLUMN SEARCH
-- ========================================

SELECT 'ALLERGEN COLUMNS' as category, table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' AND column_name ILIKE '%allergen%'
ORDER BY table_name, column_name
LIMIT 10;

-- ========================================
-- STEP 9: SUMMARY
-- ========================================

SELECT 'SUMMARY' as category, 
       'Fast database check complete - Limited samples to avoid timeouts' as note,
       'Check results above for table existence and structure' as action; 