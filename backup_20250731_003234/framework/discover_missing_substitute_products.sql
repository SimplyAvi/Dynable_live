-- DISCOVERY QUERIES: Find existing products for missing substitutes
-- Policy: Check First, Create Never (unless absolutely necessary)

-- 1. Check for almond milk products (any description containing "almond milk")
SELECT 'ALMOND MILK PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%almond milk%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 2. Check for soy milk products
SELECT 'SOY MILK PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%soy milk%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 3. Check for banana products (fresh bananas, not just banana-flavored)
SELECT 'BANANA PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE ("description" ILIKE '%banana%' AND "description" NOT ILIKE '%flavor%' AND "description" NOT ILIKE '%chips%')
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 4. Check for chia seed products
SELECT 'CHIA SEED PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%chia%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 5. Check for flax seed products
SELECT 'FLAX SEED PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%flax%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 6. Check for nutritional yeast products
SELECT 'NUTRITIONAL YEAST PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%nutritional yeast%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 7. Check for vegan cheese products (already found some, but let's see all)
SELECT 'VEGAN CHEESE PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%vegan cheese%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 8. Check for dairy-free cheese products
SELECT 'DAIRY-FREE CHEESE PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%dairy-free cheese%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 9. Check for plant-based cheese products
SELECT 'PLANT-BASED CHEESE PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%plant-based cheese%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 10. Check for applesauce products (already found some, but let's see all)
SELECT 'APPLESAUCE PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%apple sauce%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 11. Check for silken tofu products (already found some, but let's see all)
SELECT 'SILKEN TOFU PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%silken tofu%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 12. Check for yogurt products (already found some, but let's see all)
SELECT 'YOGURT PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%yogurt%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 13. Check for products with substitute-related keywords
SELECT 'SUBSTITUTE-RELATED PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE ("description" ILIKE '%substitute%' OR "description" ILIKE '%alternative%' OR "description" ILIKE '%replacement%')
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 14. Check for products with allergen-free keywords
SELECT 'ALLERGEN-FREE PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE ("description" ILIKE '%dairy-free%' OR "description" ILIKE '%gluten-free%' OR "description" ILIKE '%egg-free%' OR "description" ILIKE '%nut-free%')
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 15. Check for products with vegan keywords
SELECT 'VEGAN PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%vegan%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description;

-- 16. Check for products with plant-based keywords
SELECT 'PLANT-BASED PRODUCTS' as category;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName"
FROM "Food" 
WHERE "description" ILIKE '%plant-based%'
  AND "canonicalTagConfidence" = 'confident'
ORDER BY description; 