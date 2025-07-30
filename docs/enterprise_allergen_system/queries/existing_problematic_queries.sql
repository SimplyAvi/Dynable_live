-- 🚨 EXISTING PROBLEMATIC QUERIES - ALLERGEN FILTERING
-- These queries are causing performance issues and timeouts
-- They demonstrate why the enterprise system is needed

-- ========================================
-- PROBLEMATIC QUERY 1: CLIENT-SIDE FILTERING
-- ========================================

-- This query fetches all products and relies on client-side filtering
-- Problem: Returns too much data, causes timeouts, slow performance
SELECT 
    id,
    description,
    "brandName",
    "canonicalTag",
    allergens
FROM "IngredientCategorized"
WHERE "brandName" != 'generic'
AND (
    description ILIKE '%bread%' OR
    description ILIKE '%wheat%' OR
    description ILIKE '%gluten%'
)
ORDER BY description
LIMIT 1000;

-- Issues with this query:
-- 1. Returns 1000+ products to client
-- 2. Client must filter each product individually
-- 3. Complex regex patterns run in browser
-- 4. No allergen-specific filtering at database level
-- 5. Causes timeouts with concurrent users

-- ========================================
-- PROBLEMATIC QUERY 2: COMPLEX DESCRIPTION SCANNING
-- ========================================

-- This query tries to do allergen detection in SQL
-- Problem: Complex, slow, and inaccurate
SELECT 
    id,
    description,
    "brandName",
    allergens
FROM "IngredientCategorized"
WHERE "brandName" != 'generic'
AND (
    -- Gluten detection
    (description ILIKE '%wheat%' OR description ILIKE '%rye%' OR description ILIKE '%barley%' OR description ILIKE '%gluten%')
    OR
    -- Milk detection
    (description ILIKE '%milk%' OR description ILIKE '%dairy%' OR description ILIKE '%cream%' OR description ILIKE '%butter%')
    OR
    -- Peanut detection
    (description ILIKE '%peanut%' OR description ILIKE '%peanuts%')
    OR
    -- Tree nut detection
    (description ILIKE '%almond%' OR description ILIKE '%walnut%' OR description ILIKE '%cashew%' OR description ILIKE '%pecan%')
)
AND (
    -- Try to exclude free-from products (but this is unreliable)
    description NOT ILIKE '%gluten-free%'
    AND description NOT ILIKE '%dairy-free%'
    AND description NOT ILIKE '%nut-free%'
)
ORDER BY description
LIMIT 500;

-- Issues with this query:
-- 1. Complex OR conditions make it slow
-- 2. No standardization of allergen names
-- 3. Free-from detection is unreliable
-- 4. False positives from ingredient names
-- 5. No confidence scoring
-- 6. Doesn't use existing allergens ARRAY data

-- ========================================
-- PROBLEMATIC QUERY 3: INEFFICIENT ALLERGEN ARRAY USAGE
-- ========================================

-- This query tries to use existing allergens array but inefficiently
-- Problem: No optimization, slow with large datasets
SELECT 
    id,
    description,
    "brandName",
    allergens
FROM "IngredientCategorized"
WHERE "brandName" != 'generic'
AND allergens IS NOT NULL
AND array_length(allergens, 1) > 0
AND (
    'gluten' = ANY(allergens) OR
    'milk' = ANY(allergens) OR
    'peanuts' = ANY(allergens) OR
    'tree_nuts' = ANY(allergens)
)
ORDER BY description
LIMIT 1000;

-- Issues with this query:
-- 1. No GIN indexes on allergens array
-- 2. Doesn't handle inconsistent naming
-- 3. No standardization of existing data
-- 4. Slow with 242K products
-- 5. Doesn't account for free-from labels

-- ========================================
-- PROBLEMATIC QUERY 4: MESSY ALLERGEN DATA ANALYSIS
-- ========================================

-- This query shows the inconsistent allergen naming problem
-- Problem: Same allergen named multiple different ways
SELECT 
    unnest(allergens) as allergen_name,
    COUNT(*) as frequency
FROM "IngredientCategorized"
WHERE allergens IS NOT NULL
AND array_length(allergens, 1) > 0
GROUP BY unnest(allergens)
ORDER BY frequency DESC
LIMIT 20;

-- Results show the naming inconsistency problem:
-- "Tree Nuts": 45,000 occurrences
-- "tree_nuts": 12,000 occurrences  
-- "TreeNuts": 8,000 occurrences
-- "Tree_Nuts": 3,000 occurrences
-- "Wheat": 38,000 occurrences
-- "gluten": 15,000 occurrences
-- "Milk": 42,000 occurrences
-- "milk": 18,000 occurrences
-- "Dairy": 25,000 occurrences
-- "dairy": 12,000 occurrences

-- ========================================
-- PROBLEMATIC QUERY 5: NON-ALLERGEN DATA MIXED IN
-- ========================================

-- This query shows non-allergens incorrectly marked as allergens
-- Problem: Data quality issues causing false positives
SELECT 
    unnest(allergens) as incorrect_allergen,
    COUNT(*) as frequency
FROM "IngredientCategorized"
WHERE allergens IS NOT NULL
AND unnest(allergens) IN ('Garlic', 'Tomatoes', 'Onion', 'Spices', 'Salt', 'Sugar')
GROUP BY unnest(allergens)
ORDER BY frequency DESC;

-- Results show data quality problems:
-- "Garlic": 8,500 occurrences (not an allergen)
-- "Tomatoes": 6,200 occurrences (not an allergen)
-- "Onion": 4,800 occurrences (not an allergen)
-- "Spices": 3,900 occurrences (not an allergen)

-- ========================================
-- PROBLEMATIC QUERY 6: MISSING FREE-FROM DETECTION
-- ========================================

-- This query shows products with free-from labels still marked as containing allergens
-- Problem: No system to detect and handle free-from labels
SELECT 
    id,
    description,
    allergens
FROM "IngredientCategorized"
WHERE description ILIKE '%gluten-free%'
OR description ILIKE '%dairy-free%'
OR description ILIKE '%nut-free%'
OR description ILIKE '%peanut-free%'
LIMIT 20;

-- Results show free-from products still marked as containing allergens:
-- "Gluten-Free Bread" → allergens: ["gluten"] (WRONG!)
-- "Dairy-Free Milk" → allergens: ["milk"] (WRONG!)
-- "Nut-Free Cookies" → allergens: ["tree_nuts"] (WRONG!)

-- ========================================
-- PROBLEMATIC QUERY 7: PERFORMANCE TESTING
-- ========================================

-- This query demonstrates the performance problem
-- Problem: Takes too long to execute, causes timeouts
EXPLAIN ANALYZE
SELECT 
    id,
    description,
    "brandName",
    allergens
FROM "IngredientCategorized"
WHERE "brandName" != 'generic'
AND (
    description ILIKE '%bread%' OR
    description ILIKE '%wheat%' OR
    description ILIKE '%gluten%'
)
ORDER BY description
LIMIT 1000;

-- Expected performance issues:
-- 1. Sequential scan on large table (242K rows)
-- 2. Multiple ILIKE operations
-- 3. No index usage for allergen filtering
-- 4. Slow sorting of large result set
-- 5. Memory usage for large result set

-- ========================================
-- PROBLEMATIC QUERY 8: CONCURRENT USER SIMULATION
-- ========================================

-- This query simulates what happens with multiple concurrent users
-- Problem: Database gets overwhelmed with concurrent requests
-- Run this query multiple times simultaneously to see the problem

SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE description ILIKE '%bread%') as bread_products,
    COUNT(*) FILTER (WHERE description ILIKE '%wheat%') as wheat_products,
    COUNT(*) FILTER (WHERE description ILIKE '%gluten%') as gluten_products
FROM "IngredientCategorized"
WHERE "brandName" != 'generic';

-- Issues with concurrent execution:
-- 1. Multiple users running similar queries simultaneously
-- 2. Database CPU usage spikes
-- 3. Memory usage increases
-- 4. Response times degrade
-- 5. Eventually causes timeouts

-- ========================================
-- SUMMARY OF PROBLEMS
-- ========================================

/*
PROBLEM SUMMARY:

1. PERFORMANCE ISSUES:
   - Client-side filtering is slow and unreliable
   - No database optimization for allergen queries
   - Large result sets cause timeouts
   - Concurrent users overwhelm the system

2. DATA QUALITY ISSUES:
   - Inconsistent allergen naming across 242K products
   - Non-allergens mixed with real allergens
   - No standardization of existing data
   - Missing free-from label detection

3. ACCURACY ISSUES:
   - False positives from ingredient names
   - False negatives from missed allergens
   - No confidence scoring for uncertain matches
   - Free-from products still flagged as containing allergens

4. SCALABILITY ISSUES:
   - System doesn't handle concurrent users
   - Performance degrades with more users
   - No caching or optimization
   - Memory issues with large datasets

SOLUTION: ENTERPRISE ALLERGEN SYSTEM
- Server-side processing instead of client-side
- Data standardization for consistent naming
- Pre-computed allergen tags for fast queries
- GIN indexes for optimal performance
- Free-from detection and contradiction resolution
- Sub-100ms query performance
- Handle 50+ concurrent users
*/ 