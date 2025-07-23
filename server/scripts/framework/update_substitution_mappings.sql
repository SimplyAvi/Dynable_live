-- Update substitution mappings to use existing canonical tags with products
-- This leverages our existing sophisticated architecture

-- 1. Update flour substitutes to use existing "flour" tag (which has almond/coconut/oat flour products)
UPDATE "Substitutions" 
SET "substituteName" = 'flour', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'flour')
  AND "substituteName" IN ('almond flour', 'coconut flour', 'oat flour', 'rice flour', 'gluten-free flour blend');

-- 2. Update milk substitutes to use existing tags
UPDATE "Substitutions" 
SET "substituteName" = 'coconut milk', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'milk')
  AND "substituteName" = 'coconut milk';

UPDATE "Substitutions" 
SET "substituteName" = 'oat milk', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'milk')
  AND "substituteName" = 'oat milk';

-- 3. Update egg substitutes to use existing tags
UPDATE "Substitutions" 
SET "substituteName" = 'sauce', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'egg')
  AND "substituteName" = 'applesauce';

UPDATE "Substitutions" 
SET "substituteName" = 'tofu', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'egg')
  AND "substituteName" = 'silken tofu';

-- 4. Update cheese substitutes to use existing tags
UPDATE "Substitutions" 
SET "substituteName" = 'cheese', 
    "updatedAt" = NOW()
WHERE "CanonicalIngredientId" = (SELECT id FROM "CanonicalIngredients" WHERE name = 'cheese')
  AND "substituteName" IN ('nutritional yeast', 'vegan cheese', 'dairy-free cheese');

-- Verification queries
SELECT 'Updated flour substitutes:' as info;
SELECT ci.name as canonical_ingredient, s."substituteName", s.notes
FROM "CanonicalIngredients" ci
JOIN "Substitutions" s ON ci.id = s."CanonicalIngredientId"
WHERE ci.name = 'flour'
ORDER BY s."substituteName";

SELECT 'Updated milk substitutes:' as info;
SELECT ci.name as canonical_ingredient, s."substituteName", s.notes
FROM "CanonicalIngredients" ci
JOIN "Substitutions" s ON ci.id = s."CanonicalIngredientId"
WHERE ci.name = 'milk'
ORDER BY s."substituteName";

SELECT 'Updated egg substitutes:' as info;
SELECT ci.name as canonical_ingredient, s."substituteName", s.notes
FROM "CanonicalIngredients" ci
JOIN "Substitutions" s ON ci.id = s."CanonicalIngredientId"
WHERE ci.name = 'egg'
ORDER BY s."substituteName"; 