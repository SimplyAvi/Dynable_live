-- 🎯 COMPREHENSIVE DATABASE INSPECTION SCRIPT
-- This script will inspect the actual database structure to identify all tables and columns
-- RUN THIS FIRST to get the exact database structure before migration

-- ========================================
-- STEP 1: INSPECT ALL TABLES IN THE DATABASE
-- ========================================

-- Get all tables in the database
SELECT 
    'ALL TABLES IN DATABASE' as inspection_type,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- STEP 2: INSPECT ALLERGEN-RELATED TABLES
-- ========================================

-- Check if specific allergen-related tables exist
SELECT 
    'ALLERGEN TABLE EXISTENCE CHECK' as inspection_type,
    t.tablename,
    CASE WHEN pt.tablename IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'IngredientCategorized' as tablename
    UNION ALL SELECT 'SearchPreferences'
    UNION ALL SELECT 'AllergenDerivatives'
    UNION ALL SELECT 'IngredientAllergens'
    UNION ALL SELECT 'CanonicalIngredients'
    UNION ALL SELECT 'UserHistories'
    UNION ALL SELECT 'Food'
    UNION ALL SELECT 'AllergenCategories'
    UNION ALL SELECT 'ProductAllergens'
    UNION ALL SELECT 'SafeProductIndicators'
    UNION ALL SELECT 'allergen_standardization'
) t
LEFT JOIN pg_tables pt ON pt.tablename = t.tablename AND pt.schemaname = 'public'
ORDER BY t.tablename;

-- ========================================
-- STEP 3: INSPECT TABLE COLUMNS FOR ALLERGEN-RELATED TABLES
-- ========================================

-- Get column information for IngredientCategorized (if exists)
SELECT 
    'INGREDIENTCATEGORIZED COLUMNS' as inspection_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'IngredientCategorized' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get column information for SearchPreferences (if exists)
SELECT 
    'SEARCHPREFERENCES COLUMNS' as inspection_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'SearchPreferences' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get column information for AllergenDerivatives (if exists)
SELECT 
    'ALLERGEN DERIVATIVES COLUMNS' as inspection_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'AllergenDerivatives' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get column information for IngredientAllergens (if exists)
SELECT 
    'INGREDIENT ALLERGENS COLUMNS' as inspection_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'IngredientAllergens' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get column information for CanonicalIngredients (if exists)
SELECT 
    'CANONICAL INGREDIENTS COLUMNS' as inspection_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'CanonicalIngredients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get column information for UserHistories (if exists)
SELECT 
    'USER HISTORIES COLUMNS' as inspection_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'UserHistories' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- STEP 4: INSPECT ALLERGEN COLUMNS SPECIFICALLY
-- ========================================

-- Find all columns that might contain allergen data
SELECT 
    'ALLERGEN COLUMNS SEARCH' as inspection_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (
    column_name ILIKE '%allergen%' OR
    column_name ILIKE '%selected%' OR
    column_name ILIKE '%preference%'
)
ORDER BY table_name, column_name;

-- ========================================
-- STEP 5: INSPECT SAMPLE DATA FROM EXISTING TABLES
-- ========================================

-- Sample data from IngredientCategorized (if exists)
SELECT 
    'INGREDIENTCATEGORIZED SAMPLE DATA' as inspection_type,
    id,
    description,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM "IngredientCategorized" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
LIMIT 5;

-- Sample data from SearchPreferences (if exists)
SELECT 
    'SEARCHPREFERENCES SAMPLE DATA' as inspection_type,
    id,
    supabase_user_id,
    selected_allergens,
    jsonb_typeof(selected_allergens) as data_type
FROM "SearchPreferences" 
WHERE selected_allergens IS NOT NULL 
AND selected_allergens != '[]'::jsonb
LIMIT 3;

-- Sample data from AllergenDerivatives (if exists)
SELECT 
    'ALLERGEN DERIVATIVES SAMPLE DATA' as inspection_type,
    id,
    allergen,
    derivative
FROM "AllergenDerivatives" 
LIMIT 5;

-- Sample data from IngredientAllergens (if exists)
SELECT 
    'INGREDIENT ALLERGENS SAMPLE DATA' as inspection_type,
    id,
    "ingredientId",
    "allergenName"
FROM "IngredientAllergens" 
LIMIT 5;

-- Sample data from CanonicalIngredients (if exists)
SELECT 
    'CANONICAL INGREDIENTS SAMPLE DATA' as inspection_type,
    id,
    name,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM "CanonicalIngredients" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
LIMIT 5;

-- Sample data from UserHistories (if exists)
SELECT 
    'USER HISTORIES SAMPLE DATA' as inspection_type,
    id,
    "searchTerm",
    allergens,
    array_length(allergens, 1) as allergen_count
FROM "UserHistories" 
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
LIMIT 3;

-- ========================================
-- STEP 6: INSPECT DATA TYPES AND FORMATS
-- ========================================

-- Check allergen data types and formats
SELECT 
    'ALLERGEN DATA TYPE ANALYSIS' as inspection_type,
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'ARRAY' THEN 'Array type'
        WHEN data_type = 'jsonb' THEN 'JSONB type'
        WHEN data_type = 'character varying' THEN 'VARCHAR type'
        ELSE 'Other type'
    END as type_category
FROM information_schema.columns 
WHERE table_schema = 'public'
AND column_name ILIKE '%allergen%'
ORDER BY table_name, column_name;

-- ========================================
-- STEP 7: INSPECT INDEXES ON ALLERGEN COLUMNS
-- ========================================

-- Check indexes on allergen-related columns
SELECT 
    'ALLERGEN COLUMN INDEXES' as inspection_type,
    t.tablename,
    i.indexname,
    i.indexdef
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE t.schemaname = 'public'
AND (
    i.indexdef ILIKE '%allergen%' OR
    i.indexdef ILIKE '%selected%' OR
    i.indexdef ILIKE '%preference%'
)
ORDER BY t.tablename, i.indexname;

-- ========================================
-- STEP 8: INSPECT CONSTRAINTS ON ALLERGEN TABLES
-- ========================================

-- Check constraints on allergen-related tables
SELECT 
    'ALLERGEN TABLE CONSTRAINTS' as inspection_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND (
    tc.table_name ILIKE '%allergen%' OR
    tc.table_name ILIKE '%search%' OR
    tc.table_name ILIKE '%ingredient%' OR
    tc.table_name ILIKE '%user%'
)
ORDER BY tc.table_name, tc.constraint_type;

-- ========================================
-- STEP 9: SUMMARY REPORT
-- ========================================

SELECT 
    'DATABASE INSPECTION SUMMARY' as inspection_type,
    'Run this script to get exact database structure' as note,
    'Check all results above to verify table names and column structures' as action,
    'Update migration scripts based on actual database structure' as next_step; 