-- 🚀 STEP-BY-STEP INDEX CREATION - ADVISOR'S RECOMMENDATIONS
-- Run each command individually in your Supabase SQL Editor
-- Author: Justin Linzan
-- Date: January 2025

-- ========================================
-- STEP 1: CREATE COMPOSITE INDEX FOR ALLERGEN FILTERING + PAGINATION
-- ========================================
-- Copy and paste this command FIRST, then click "Run"

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_allergen_pagination 
ON "IngredientCategorized" (allergens, id);

-- ========================================
-- STEP 2: CREATE COMPOSITE INDEX FOR SEARCH + PAGINATION
-- ========================================
-- Copy and paste this command SECOND, then click "Run"

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_search_pagination 
ON "IngredientCategorized" (description, id);

-- ========================================
-- STEP 3: CREATE COVERING INDEX FOR COMMON QUERIES
-- ========================================
-- Copy and paste this command THIRD, then click "Run"

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_covering 
ON "IngredientCategorized" (id, description, "brandName", allergens)
WHERE "brandName" != 'generic';

-- ========================================
-- STEP 4: CREATE PARTIAL INDEX FOR ALLERGEN FILTERING
-- ========================================
-- Copy and paste this command FOURTH, then click "Run"

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_allergen_partial 
ON "IngredientCategorized" (id, description)
WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0;

-- ========================================
-- STEP 5: VERIFY INDEX CREATION
-- ========================================
-- Copy and paste this command FIFTH, then click "Run"

SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'IngredientCategorized'
AND indexname LIKE '%pagination%'
ORDER BY indexname;

-- ========================================
-- STEP 6: TEST CORRECT ALLERGEN SYNTAX
-- ========================================
-- Copy and paste this command SIXTH, then click "Run"

SELECT 'Test 1: Correct allergen exclusion' as test_name;
SELECT COUNT(*) as total_products_without_allergens
FROM "IngredientCategorized"
WHERE NOT (allergens && ARRAY['milk', 'peanuts']);

-- ========================================
-- STEP 7: TEST ALTERNATIVE SYNTAX
-- ========================================
-- Copy and paste this command SEVENTH, then click "Run"

SELECT 'Test 2: Alternative syntax' as test_name;
SELECT COUNT(*) as total_products_without_allergens
FROM "IngredientCategorized"
WHERE allergens @> ARRAY['milk', 'peanuts'] = FALSE;

-- ========================================
-- STEP 8: TEST PERFORMANCE WITH PAGINATION
-- ========================================
-- Copy and paste this command EIGHTH, then click "Run"

SELECT 'Test 3: Performance with pagination' as test_name;
SELECT 
    id, 
    description, 
    "brandName", 
    allergens
FROM "IngredientCategorized"
WHERE NOT (allergens && ARRAY['milk', 'peanuts'])
AND "brandName" != 'generic'
ORDER BY id
LIMIT 20 OFFSET 40;

-- ========================================
-- STEP 9: PERFORMANCE COMPARISON
-- ========================================
-- Copy and paste this command NINTH, then click "Run"

SELECT 'Performance Test with GIN Index:' as test_name;
EXPLAIN ANALYZE
SELECT COUNT(*) 
FROM "IngredientCategorized"
WHERE NOT (allergens && ARRAY['milk', 'peanuts']);

-- ========================================
-- STEP 10: FINAL VERIFICATION
-- ========================================
-- Copy and paste this command TENTH, then click "Run"

SELECT 'Final Verification Test:' as test_name;
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE NOT (allergens && ARRAY['milk', 'peanuts'])) as safe_products,
    COUNT(*) FILTER (WHERE allergens && ARRAY['milk', 'peanuts']) as unsafe_products
FROM "IngredientCategorized"
WHERE "brandName" != 'generic';

-- ========================================
-- INSTRUCTIONS
-- ========================================

/*
STEP-BY-STEP EXECUTION:

1. Copy STEP 1 command → Paste in SQL Editor → Click "Run"
2. Copy STEP 2 command → Paste in SQL Editor → Click "Run"
3. Copy STEP 3 command → Paste in SQL Editor → Click "Run"
4. Copy STEP 4 command → Paste in SQL Editor → Click "Run"
5. Copy STEP 5 command → Paste in SQL Editor → Click "Run" (Verify indexes created)
6. Copy STEP 6 command → Paste in SQL Editor → Click "Run" (Test allergen syntax)
7. Copy STEP 7 command → Paste in SQL Editor → Click "Run" (Test alternative)
8. Copy STEP 8 command → Paste in SQL Editor → Click "Run" (Test pagination)
9. Copy STEP 9 command → Paste in SQL Editor → Click "Run" (Performance test)
10. Copy STEP 10 command → Paste in SQL Editor → Click "Run" (Final verification)

EXPECTED RESULTS:
- ✅ All indexes created successfully
- ✅ Allergen filtering works with correct syntax
- ✅ Performance improved significantly
- ✅ No timeout errors

NEXT STEPS:
1. Update frontend code to use: query.not('allergens', 'ov', allergens)
2. Test homepage with allergens enabled
3. Verify sub-200ms response times
*/ 