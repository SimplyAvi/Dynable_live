-- 🏷️ ALLERGEN CATEGORIES TABLE
-- Dynable App - Allergen Classification System

-- Create allergen categories table
CREATE TABLE IF NOT EXISTS "AllergenCategories" (
    id SERIAL PRIMARY KEY,
    allergen_name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('major', 'sensitivity', 'intolerance')),
    description TEXT,
    severity_level INTEGER DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert standard allergen categories
INSERT INTO "AllergenCategories" (allergen_name, category, description, severity_level) VALUES
-- Major allergens (FDA top 9) - Severity 5
('milk', 'major', 'Dairy products and derivatives', 5),
('eggs', 'major', 'Chicken eggs and egg products', 5),
('fish', 'major', 'Finfish and fish products', 5),
('shellfish', 'major', 'Crustaceans and mollusks', 5),
('treeNuts', 'major', 'Tree nuts (almonds, walnuts, etc.)', 5),
('peanuts', 'major', 'Peanuts and peanut products', 5),
('wheat', 'major', 'Wheat and wheat products', 5),
('soy', 'major', 'Soybean and soy products', 5),
('sesame', 'major', 'Sesame seeds and sesame products', 5),

-- Common sensitivities - Severity 3-4
('garlic', 'sensitivity', 'Garlic sensitivity', 3),
('tomatoes', 'sensitivity', 'Tomato sensitivity', 3),
('onions', 'sensitivity', 'Onion sensitivity', 3),
('corn', 'sensitivity', 'Corn sensitivity', 3),
('mustard', 'sensitivity', 'Mustard sensitivity', 3),
('celery', 'sensitivity', 'Celery sensitivity', 3),
('chocolate', 'sensitivity', 'Chocolate sensitivity', 3),
('strawberries', 'sensitivity', 'Strawberry sensitivity', 3),
('peaches', 'sensitivity', 'Peach sensitivity', 3),

-- Intolerances - Severity 4
('gluten', 'intolerance', 'Gluten intolerance/celiac', 4),
('lactose', 'intolerance', 'Lactose intolerance', 4),

-- Free-from categories - Severity 4
('glutenFree', 'intolerance', 'Gluten-free products', 4),
('dairyFree', 'intolerance', 'Dairy-free products', 4),
('eggFree', 'intolerance', 'Egg-free products', 4),
('soyFree', 'intolerance', 'Soy-free products', 4),
('nutFree', 'intolerance', 'Nut-free products', 4),
('fishFree', 'intolerance', 'Fish-free products', 4),

-- Common multi-word allergens (camelCase) - Severity 3
('bellPepper', 'sensitivity', 'Bell pepper sensitivity', 3),
('blackPepper', 'sensitivity', 'Black pepper sensitivity', 3),
('hotSauce', 'sensitivity', 'Hot sauce sensitivity', 3),
('coconutOil', 'sensitivity', 'Coconut oil sensitivity', 3),
('palmOil', 'sensitivity', 'Palm oil sensitivity', 3),
('sunflowerOil', 'sensitivity', 'Sunflower oil sensitivity', 3),
('vegetableOil', 'sensitivity', 'Vegetable oil sensitivity', 3),
('oliveOil', 'sensitivity', 'Olive oil sensitivity', 3),
('avocadoOil', 'sensitivity', 'Avocado oil sensitivity', 3),
('kiwiFruit', 'sensitivity', 'Kiwi fruit sensitivity', 3),
('dragonFruit', 'sensitivity', 'Dragon fruit sensitivity', 3),
('passionFruit', 'sensitivity', 'Passion fruit sensitivity', 3),
('sweetPotatoes', 'sensitivity', 'Sweet potatoes sensitivity', 3),
('yellowSquash', 'sensitivity', 'Yellow squash sensitivity', 3),
('butternutSquash', 'sensitivity', 'Butternut squash sensitivity', 3),
('greenBeans', 'sensitivity', 'Green beans sensitivity', 3),
('blackBeans', 'sensitivity', 'Black beans sensitivity', 3),
('pintoBeans', 'sensitivity', 'Pinto beans sensitivity', 3),
('kidneyBeans', 'sensitivity', 'Kidney beans sensitivity', 3),
('navyBeans', 'sensitivity', 'Navy beans sensitivity', 3),
('blackEyedPeas', 'sensitivity', 'Black eyed peas sensitivity', 3),
('splitPeas', 'sensitivity', 'Split peas sensitivity', 3),
('brownRice', 'sensitivity', 'Brown rice sensitivity', 3),
('whiteRice', 'sensitivity', 'White rice sensitivity', 3),
('wildRice', 'sensitivity', 'Wild rice sensitivity', 3),
('greekYogurt', 'sensitivity', 'Greek yogurt sensitivity', 3),
('sourCream', 'sensitivity', 'Sour cream sensitivity', 3),
('heavyCream', 'sensitivity', 'Heavy cream sensitivity', 3),
('halfAndHalf', 'sensitivity', 'Half and half sensitivity', 3),
('wholeMilk', 'sensitivity', 'Whole milk sensitivity', 3),
('skimMilk', 'sensitivity', 'Skim milk sensitivity', 3),
('almondMilk', 'sensitivity', 'Almond milk sensitivity', 3),
('soyMilk', 'sensitivity', 'Soy milk sensitivity', 3),
('oatMilk', 'sensitivity', 'Oat milk sensitivity', 3),
('coconutMilk', 'sensitivity', 'Coconut milk sensitivity', 3),
('riceMilk', 'sensitivity', 'Rice milk sensitivity', 3),
('energyDrinks', 'sensitivity', 'Energy drinks sensitivity', 3),
('sportsDrinks', 'sensitivity', 'Sports drinks sensitivity', 3),
('artificialColors', 'sensitivity', 'Artificial colors sensitivity', 3),
('foodDyes', 'sensitivity', 'Food dyes sensitivity', 3),
('citricAcid', 'sensitivity', 'Citric acid sensitivity', 3),
('vanillaExtract', 'sensitivity', 'Vanilla extract sensitivity', 3)
ON CONFLICT (allergen_name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    severity_level = EXCLUDED.severity_level,
    updated_at = NOW();

-- Create function to get allergen category
CREATE OR REPLACE FUNCTION get_allergen_category(allergen_name TEXT)
RETURNS TABLE(
    category TEXT,
    description TEXT,
    severity_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT ac.category, ac.description, ac.severity_level
    FROM "AllergenCategories" ac
    WHERE ac.allergen_name = lower(allergen_name);
END;
$$ LANGUAGE plpgsql;

-- Create function to get all allergens by category
CREATE OR REPLACE FUNCTION get_allergens_by_category(category_filter TEXT)
RETURNS TABLE(
    allergen_name TEXT,
    category TEXT,
    description TEXT,
    severity_level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT ac.allergen_name, ac.category, ac.description, ac.severity_level
    FROM "AllergenCategories" ac
    WHERE ac.category = category_filter
    ORDER BY ac.severity_level DESC, ac.allergen_name;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate allergen name
CREATE OR REPLACE FUNCTION is_valid_allergen(allergen_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "AllergenCategories" 
        WHERE allergen_name = lower(allergen_name)
    );
END;
$$ LANGUAGE plpgsql;

-- Create view for easy allergen lookup
CREATE OR REPLACE VIEW allergen_lookup AS
SELECT 
    allergen_name,
    category,
    description,
    severity_level,
    CASE 
        WHEN severity_level = 5 THEN 'Critical'
        WHEN severity_level = 4 THEN 'High'
        WHEN severity_level = 3 THEN 'Medium'
        WHEN severity_level = 2 THEN 'Low'
        ELSE 'Unknown'
    END as severity_label
FROM "AllergenCategories"
ORDER BY severity_level DESC, allergen_name;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_allergen_categories_name 
ON "AllergenCategories" (allergen_name);

CREATE INDEX IF NOT EXISTS idx_allergen_categories_category 
ON "AllergenCategories" (category); 