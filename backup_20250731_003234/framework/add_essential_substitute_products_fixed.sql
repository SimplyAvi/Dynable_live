-- Add Essential Substitute Products (Fixed Column Names)
-- These are real products that home cooks actually need for substitutions
-- Not generic placeholders, but legitimate cooking ingredients

-- 1. Fresh Bananas (for egg substitution)
INSERT INTO "Food" (
  description, 
  "canonicalTag", 
  "canonicalTagConfidence", 
  "brandName", 
  "shortDescription",
  "brandOwner",
  "foodClass",
  "servingSize",
  "servingSizeUnit"
) VALUES (
  'Fresh Ripe Bananas',
  'banana',
  'confident',
  'Generic',
  'Fresh bananas for baking and egg substitution',
  'Generic',
  'Foundation',
  '1',
  'medium banana'
);

-- 2. Almond Milk (for milk substitution)
INSERT INTO "Food" (
  description, 
  "canonicalTag", 
  "canonicalTagConfidence", 
  "brandName", 
  "shortDescription",
  "brandOwner",
  "foodClass",
  "servingSize",
  "servingSizeUnit"
) VALUES (
  'Unsweetened Almond Milk',
  'almond milk',
  'confident',
  'Generic',
  'Unsweetened almond milk for dairy substitution',
  'Generic',
  'Foundation',
  '1',
  'cup'
);

-- 3. Soy Milk (for milk substitution)
INSERT INTO "Food" (
  description, 
  "canonicalTag", 
  "canonicalTagConfidence", 
  "brandName", 
  "shortDescription",
  "brandOwner",
  "foodClass",
  "servingSize",
  "servingSizeUnit"
) VALUES (
  'Unsweetened Soy Milk',
  'soy milk',
  'confident',
  'Generic',
  'Unsweetened soy milk for dairy substitution',
  'Generic',
  'Foundation',
  '1',
  'cup'
);

-- 4. Chia Seeds (for egg substitution)
INSERT INTO "Food" (
  description, 
  "canonicalTag", 
  "canonicalTagConfidence", 
  "brandName", 
  "shortDescription",
  "brandOwner",
  "foodClass",
  "servingSize",
  "servingSizeUnit"
) VALUES (
  'Whole Chia Seeds',
  'chia seeds',
  'confident',
  'Generic',
  'Whole chia seeds for egg substitution (1 tbsp + 3 tbsp water)',
  'Generic',
  'Foundation',
  '1',
  'tablespoon'
);

-- 5. Ground Flax Seeds (for egg substitution)
INSERT INTO "Food" (
  description, 
  "canonicalTag", 
  "canonicalTagConfidence", 
  "brandName", 
  "shortDescription",
  "brandOwner",
  "foodClass",
  "servingSize",
  "servingSizeUnit"
) VALUES (
  'Ground Flax Seeds',
  'flax seeds',
  'confident',
  'Generic',
  'Ground flax seeds for egg substitution (1 tbsp + 3 tbsp water)',
  'Generic',
  'Foundation',
  '1',
  'tablespoon'
);

-- 6. Nutritional Yeast (for cheese substitution)
INSERT INTO "Food" (
  description, 
  "canonicalTag", 
  "canonicalTagConfidence", 
  "brandName", 
  "shortDescription",
  "brandOwner",
  "foodClass",
  "servingSize",
  "servingSizeUnit"
) VALUES (
  'Nutritional Yeast Flakes',
  'nutritional yeast',
  'confident',
  'Generic',
  'Nutritional yeast flakes for cheese substitution',
  'Generic',
  'Foundation',
  '1',
  'tablespoon'
);

-- Verification: Check what we added
SELECT 'ADDED ESSENTIAL SUBSTITUTE PRODUCTS:' as info;
SELECT id, description, "canonicalTag", "canonicalTagConfidence", "brandName", "shortDescription"
FROM "Food" 
WHERE "canonicalTag" IN ('banana', 'almond milk', 'soy milk', 'chia seeds', 'flax seeds', 'nutritional yeast')
  AND "brandName" = 'Generic'
ORDER BY "canonicalTag"; 