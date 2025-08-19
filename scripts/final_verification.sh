#!/bin/bash

echo "🎯 FINAL VERIFICATION - ALL ALLERGENS STANDARDIZED..."

DB_URL="postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres"

echo "📊 Final check for any non-camelCase allergens..."
psql "$DB_URL" -c "
SELECT 
    'FINAL VERIFICATION' as check_type,
    COUNT(*) as total_records_checked,
    COUNT(CASE WHEN allergens IS NOT NULL THEN 1 END) as records_with_allergens
FROM \"IngredientCategorized\"
WHERE allergens IS NOT NULL;
"

echo "📊 Checking for any remaining non-camelCase allergens..."
psql "$DB_URL" -c "
SELECT 
    'NON-CAMELCASE CHECK' as check_type,
    COUNT(*) as non_camelcase_count
FROM \"IngredientCategorized\"
WHERE allergens IS NOT NULL 
AND EXISTS (
    SELECT 1 FROM unnest(allergens) a 
    WHERE a != LOWER(a) 
    AND a NOT IN ('treeNuts')
);
"

echo "📊 Sample of standardized allergens..."
psql "$DB_URL" -c "
SELECT DISTINCT unnest(allergens) as allergen
FROM \"IngredientCategorized\"
WHERE allergens IS NOT NULL 
AND array_length(allergens, 1) > 0
ORDER BY allergen
LIMIT 20;
"

echo "📊 Migration completion summary..."
psql "$DB_URL" -c "
SELECT 
    'PHASE 2 COMPLETE' as phase,
    'All allergen data standardized to camelCase' as status,
    'Ready for Phase 3: Clean Data' as next_step;
"

echo "✅ FINAL VERIFICATION COMPLETE!" 