-- 🏷️ DATABASE CONSTRAINTS FOR ALLERGEN RULES
-- Dynable App - Data Quality Enforcement

-- CONSTRAINT 1: No spaces in allergen names
ALTER TABLE "IngredientCategorized" 
ADD CONSTRAINT check_allergens_no_spaces 
CHECK (
    allergens IS NULL OR 
    NOT EXISTS (
        SELECT 1 FROM unnest(allergens) AS allergen 
        WHERE allergen LIKE '% %'
    )
);

-- CONSTRAINT 2: No underscores in allergen names  
ALTER TABLE "IngredientCategorized" 
ADD CONSTRAINT check_allergens_no_underscores 
CHECK (
    allergens IS NULL OR 
    NOT EXISTS (
        SELECT 1 FROM unnest(allergens) AS allergen 
        WHERE allergen LIKE '%_%'
    )
);

-- Function to validate camelCase format
CREATE OR REPLACE FUNCTION is_valid_camel_case(text_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Must start with lowercase letter
    -- Can contain uppercase letters (but not at start)
    -- No spaces, underscores, or hyphens allowed
    -- Must be at least 1 character
    RETURN text_input ~ '^[a-z][a-zA-Z0-9]*$';
END;
$$ LANGUAGE plpgsql;

-- CONSTRAINT 3: Enforce camelCase format
ALTER TABLE "IngredientCategorized" 
DROP CONSTRAINT IF EXISTS check_allergens_lowercase;

ALTER TABLE "IngredientCategorized" 
ADD CONSTRAINT check_allergens_camelcase 
CHECK (
    allergens IS NULL OR 
    NOT EXISTS (
        SELECT 1 FROM unnest(allergens) AS allergen 
        WHERE NOT is_valid_camel_case(allergen)
    )
);

-- CONSTRAINT 4: Only valid allergen names allowed
ALTER TABLE "IngredientCategorized" 
ADD CONSTRAINT check_allergens_valid_names 
CHECK (
    allergens IS NULL OR 
    NOT EXISTS (
        SELECT 1 FROM unnest(allergens) AS allergen 
        WHERE allergen NOT IN (
            -- Major allergens
            'milk', 'eggs', 'fish', 'shellfish', 'treeNuts', 'peanuts', 
            'wheat', 'soy', 'sesame', 'gluten',
            -- Sensitivities
            'garlic', 'tomatoes', 'onions', 'corn', 'mustard', 'celery', 
            'chocolate', 'strawberries', 'peaches',
            -- Intolerances
            'lactose',
            -- Free-from categories
            'glutenFree', 'dairyFree', 'eggFree', 'soyFree', 'nutFree', 'fishFree',
            -- Common multi-word allergens (camelCase)
            'bellPepper', 'blackPepper', 'hotSauce', 'coconutOil', 'palmOil', 
            'sunflowerOil', 'vegetableOil', 'oliveOil', 'avocadoOil', 'kiwiFruit',
            'dragonFruit', 'passionFruit', 'sweetPotatoes', 'yellowSquash', 
            'butternutSquash', 'greenBeans', 'blackBeans', 'pintoBeans', 
            'kidneyBeans', 'navyBeans', 'blackEyedPeas', 'splitPeas', 'brownRice',
            'whiteRice', 'wildRice', 'greekYogurt', 'sourCream', 'heavyCream',
            'halfAndHalf', 'wholeMilk', 'skimMilk', 'almondMilk', 'soyMilk',
            'oatMilk', 'coconutMilk', 'riceMilk', 'energyDrinks', 'sportsDrinks',
            'artificialColors', 'foodDyes', 'citricAcid', 'vanillaExtract'
        )
    )
);

-- CONSTRAINT 5: No duplicate allergens in array
ALTER TABLE "IngredientCategorized" 
ADD CONSTRAINT check_allergens_no_duplicates 
CHECK (
    allergens IS NULL OR 
    array_length(allergens, 1) = array_length(array(
        SELECT DISTINCT unnest(allergens)
    ), 1)
);

-- CONSTRAINT 6: No empty strings in allergen array
ALTER TABLE "IngredientCategorized" 
ADD CONSTRAINT check_allergens_no_empty_strings 
CHECK (
    allergens IS NULL OR 
    NOT EXISTS (
        SELECT 1 FROM unnest(allergens) AS allergen 
        WHERE allergen = '' OR allergen IS NULL
    )
);

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'IngredientCategorized' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE "IngredientCategorized" 
        ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Create index for better performance on allergen searches
CREATE INDEX IF NOT EXISTS idx_ingredient_allergens 
ON "IngredientCategorized" USING GIN (allergens);

-- Create index for description searches (for free-from detection)
CREATE INDEX IF NOT EXISTS idx_ingredient_description_lower 
ON "IngredientCategorized" (lower(description)); 