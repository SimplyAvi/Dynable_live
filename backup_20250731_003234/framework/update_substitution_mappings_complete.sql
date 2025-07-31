-- Update Substitution Mappings to Include All Essential Substitute Products
-- This ensures all substitutes have corresponding products

-- 1. Update milk substitutes to include almond milk and soy milk
UPDATE "Substitutions" 
SET "substituteName" = 'almond milk', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'milk')
  AND "substituteName" = 'almond milk';

UPDATE "Substitutions" 
SET "substituteName" = 'soy milk', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'milk')
  AND "substituteName" = 'soy milk';

-- 2. Update egg substitutes to include banana, chia seeds, and flax seeds
UPDATE "Substitutions" 
SET "substituteName" = 'banana', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'egg')
  AND "substituteName" = 'banana';

UPDATE "Substitutions" 
SET "substituteName" = 'chia seeds', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'egg')
  AND "substituteName" = 'chia egg';

UPDATE "Substitutions" 
SET "substituteName" = 'flax seeds', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'egg')
  AND "substituteName" = 'flax egg';

-- 3. Update cheese substitutes to include nutritional yeast
UPDATE "Substitutions" 
SET "substituteName" = 'nutritional yeast', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'cheese')
  AND "substituteName" = 'nutritional yeast';

-- 4. Clean up duplicate substitution entries
DELETE FROM "Substitutions" s1
USING "Substitutions" s2
WHERE s1.id > s2.id 
  AND s1."CanonicalIngredientId" = s2."CanonicalIngredientId"
  AND s1."substituteName" = s2."substituteName";

-- Verification: Check updated substitution mappings
SELECT 'UPDATED SUBSTITUTION MAPPINGS:' as info;

SELECT 'Flour substitutes:' as test;
SELECT ci.name as canonical_ingredient, s."substituteName", s.notes
FROM "CanonicalIngredients" ci
JOIN "Substitutions" s ON ci.id = s."CanonicalIngredientId"
WHERE ci.name = 'flour'
ORDER BY s."substituteName";

SELECT 'Milk substitutes:' as test;
SELECT ci.name as canonical_ingredient, s."substituteName", s.notes
FROM "CanonicalIngredients" ci
JOIN "Substitutions" s ON ci.id = s."CanonicalIngredientId"
WHERE ci.name = 'milk'
ORDER BY s."substituteName";

SELECT 'Egg substitutes:' as test;
SELECT ci.name as canonical_ingredient, s."substituteName", s.notes
FROM "CanonicalIngredients" ci
JOIN "Substitutions" s ON ci.id = s."CanonicalIngredientId"
WHERE ci.name = 'egg'
ORDER BY s."substituteName";

SELECT 'Cheese substitutes:' as test;
SELECT ci.name as canonical_ingredient, s."substituteName", s.notes
FROM "CanonicalIngredients" ci
JOIN "Substitutions" s ON ci.id = s."CanonicalIngredientId"
WHERE ci.name = 'cheese'
ORDER BY s."substituteName";

-- Test product availability for each substitute
SELECT 'PRODUCT AVAILABILITY TEST:' as info;

SELECT 'Products for flour substitutes:' as test;
SELECT s."substituteName", COUNT(f.id) as product_count
FROM "Substitutions" s
JOIN "CanonicalIngredients" ci ON s."CanonicalIngredientId" = ci.id
LEFT JOIN "Food" f ON s."substituteName" = f."canonicalTag" AND f."canonicalTagConfidence" = 'confident'
WHERE ci.name = 'flour'
GROUP BY s."substituteName"
ORDER BY s."substituteName";

SELECT 'Products for milk substitutes:' as test;
SELECT s."substituteName", COUNT(f.id) as product_count
FROM "Substitutions" s
JOIN "CanonicalIngredients" ci ON s."CanonicalIngredientId" = ci.id
LEFT JOIN "Food" f ON s."substituteName" = f."canonicalTag" AND f."canonicalTagConfidence" = 'confident'
WHERE ci.name = 'milk'
GROUP BY s."substituteName"
ORDER BY s."substituteName";

SELECT 'Products for egg substitutes:' as test;
SELECT s."substituteName", COUNT(f.id) as product_count
FROM "Substitutions" s
JOIN "CanonicalIngredients" ci ON s."CanonicalIngredientId" = ci.id
LEFT JOIN "Food" f ON s."substituteName" = f."canonicalTag" AND f."canonicalTagConfidence" = 'confident'
WHERE ci.name = 'egg'
GROUP BY s."substituteName"
ORDER BY s."substituteName"; 