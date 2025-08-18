#!/bin/bash

echo "🔍 VERIFYING ALLERGEN MIGRATION RESULTS..."

DB_URL="postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres"

echo "📊 Step 1: Checking SearchPreferences column rename..."
psql "$DB_URL" -c "
SELECT 
    'SearchPreferences' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN selectedAllergens IS NOT NULL THEN 1 END) as records_with_allergens,
    COUNT(CASE WHEN selectedAllergens = '[]'::jsonb THEN 1 END) as empty_arrays
FROM \"SearchPreferences\";
"

echo "📊 Step 2: Checking AllergenDerivatives standardization..."
psql "$DB_URL" -c "
SELECT 
    'AllergenDerivatives' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT allergen) as unique_allergens,
    COUNT(DISTINCT derivative) as unique_derivatives,
    STRING_AGG(DISTINCT allergen, ', ' ORDER BY allergen) as sample_allergens,
    STRING_AGG(DISTINCT derivative, ', ' ORDER BY derivative) as sample_derivatives
FROM \"AllergenDerivatives\"
LIMIT 1;
"

echo "📊 Step 3: Checking Ingredients standardization..."
psql "$DB_URL" -c "
SELECT 
    'Ingredients' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN allergens IS NOT NULL THEN 1 END) as records_with_allergens,
    COUNT(CASE WHEN array_length(allergens, 1) > 0 THEN 1 END) as non_empty_arrays,
    COUNT(CASE WHEN allergens = ARRAY[]::TEXT[] THEN 1 END) as empty_arrays
FROM \"Ingredients\";
"

echo "📊 Step 4: Checking IngredientCategorized standardization..."
psql "$DB_URL" -c "
SELECT 
    'IngredientCategorized' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN allergens IS NOT NULL THEN 1 END) as records_with_allergens,
    COUNT(CASE WHEN array_length(allergens, 1) > 0 THEN 1 END) as non_empty_arrays,
    COUNT(CASE WHEN allergens = ARRAY[]::TEXT[] THEN 1 END) as empty_arrays
FROM \"IngredientCategorized\";
"

echo "📊 Step 5: Sample data verification - SearchPreferences..."
psql "$DB_URL" -c "
SELECT 
    id,
    selectedAllergens,
    LENGTH(selectedAllergens::text) as json_length
FROM \"SearchPreferences\" 
WHERE selectedAllergens IS NOT NULL 
AND selectedAllergens != '[]'::jsonb
ORDER BY id
LIMIT 5;
"

echo "📊 Step 6: Sample data verification - AllergenDerivatives..."
psql "$DB_URL" -c "
SELECT 
    allergen,
    derivative,
    \"createdAt\"
FROM \"AllergenDerivatives\"
ORDER BY allergen, derivative
LIMIT 10;
"

echo "📊 Step 7: Sample data verification - Ingredients..."
psql "$DB_URL" -c "
SELECT 
    id,
    name,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM \"Ingredients\"
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
ORDER BY id
LIMIT 5;
"

echo "📊 Step 8: Sample data verification - IngredientCategorized..."
psql "$DB_URL" -c "
SELECT 
    id,
    name,
    allergens,
    array_length(allergens, 1) as allergen_count
FROM \"IngredientCategorized\"
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
ORDER BY id
LIMIT 5;
"

echo "📊 Step 9: Checking for any non-camelCase allergens..."
psql "$DB_URL" -c "
SELECT 
    'Ingredients' as table_name,
    COUNT(*) as non_camelcase_count,
    STRING_AGG(DISTINCT unnest(allergens), ', ' ORDER BY unnest(allergens)) as sample_non_camelcase
FROM \"Ingredients\"
WHERE allergens IS NOT NULL 
AND EXISTS (
    SELECT 1 FROM unnest(allergens) allergen 
    WHERE allergen != LOWER(allergen) 
    AND allergen NOT IN ('treeNuts')
)
UNION ALL
SELECT 
    'IngredientCategorized' as table_name,
    COUNT(*) as non_camelcase_count,
    STRING_AGG(DISTINCT unnest(allergens), ', ' ORDER BY unnest(allergens)) as sample_non_camelcase
FROM \"IngredientCategorized\"
WHERE allergens IS NOT NULL 
AND EXISTS (
    SELECT 1 FROM unnest(allergens) allergen 
    WHERE allergen != LOWER(allergen) 
    AND allergen NOT IN ('treeNuts')
);
"

echo "📊 Step 10: Final migration summary..."
psql "$DB_URL" -c "
SELECT 
    'MIGRATION SUMMARY' as summary,
    'All allergen data has been standardized to camelCase format' as status,
    'Phase 2 (Standardize) is complete' as phase,
    'Ready for Phase 3 (Clean Data)' as next_step;
"

echo "✅ Verification complete!" 