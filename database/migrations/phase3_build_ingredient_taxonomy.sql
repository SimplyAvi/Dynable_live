-- ============================================================================
-- DYNABLE DATABASE MIGRATION: PHASE 3
-- ============================================================================
-- Purpose: Build ingredient taxonomy from 683,784 recipe ingredients
-- Status: Zero downtime - website continues working with old tables
-- Date: 2025-10-22
-- Reference: DATABASE_ARCHITECTURE_ANALYSIS.md Lines 1321-1350
-- Reference: PHASE3_STRATEGY.md (Extraction strategy)
-- ============================================================================

-- Log Phase 3 start
INSERT INTO public.migration_status (phase, step, status, started_at)
VALUES ('Phase 3', 'Ingredient Taxonomy Creation', 'in_progress', NOW());

-- ============================================================================
-- STEP 1: EXTRACT AND CLEAN INGREDIENT NAMES
-- ============================================================================

DO $$
DECLARE
    ingredient_count INT := 0;
    total_recipe_ingredients INT;
BEGIN
    SELECT COUNT(*) INTO total_recipe_ingredients FROM "RecipeIngredients";
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PHASE 3: INGREDIENT TAXONOMY CREATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total recipe ingredient entries: %', total_recipe_ingredients;
    RAISE NOTICE 'Extracting unique canonical ingredients...';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Extract and clean ingredient names
    -- This will create ~10,000-20,000 unique canonical ingredients
    INSERT INTO ingredients (canonical_name, category, subcategory, is_basic_ingredient, description)
    SELECT DISTINCT
        -- Clean the ingredient name
        LOWER(
            TRIM(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(
                            REGEXP_REPLACE(
                                REGEXP_REPLACE(
                                    REGEXP_REPLACE(
                                        REGEXP_REPLACE(
                                            REGEXP_REPLACE(
                                                name,
                                                '^\d+(/\d+)?\s*(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|pound|pounds|ounce|ounces|oz|lb|tsp|tbsp|c\.)\s*', 
                                                '', 
                                                'i'
                                            ),  -- Remove leading measurements
                                            '\s*-\s*(peeled|chopped|diced|minced|sliced|cubed|crushed|ground|shredded|grated|julienned|halved|quartered).*$',
                                            '',
                                            'i'
                                        ),  -- Remove preparation instructions
                                        '\s*,\s*(or as needed|to taste|optional|if desired|plus more).*$',
                                        '',
                                        'i'
                                    ),  -- Remove optional phrases
                                    '\s*\(.*?\)',
                                    '',
                                    'g'
                                ),  -- Remove parenthetical notes
                                '[*\[\]()]',
                                '',
                                'g'
                            ),  -- Remove special characters
                            '\s+',
                            ' ',
                            'g'
                        ),  -- Normalize whitespace
                        '^\s*(fresh|dried|frozen|canned|raw|cooked|organic)\s+',
                        '',
                        'i'
                    ),  -- Remove common modifiers
                    '^\s*(Pure|100%)\s+',
                    '',
                    'i'
                )  -- Remove brand-like prefixes
            )
        ) as canonical_name,
        
        'unknown' as category,  -- Will be categorized in next step
        NULL as subcategory,
        true as is_basic_ingredient,
        'Extracted from recipe: ' || name as description
        
    FROM "RecipeIngredients"
    WHERE 
        LENGTH(TRIM(name)) > 2  -- Skip very short names
        AND name NOT ILIKE '%cup%'  -- Skip measurement-only entries
        AND name NOT ILIKE '%tablespoon%'
        AND name NOT ILIKE '%teaspoon%'
        AND name NOT ILIKE 'to taste%'
        AND name NOT ILIKE 'as needed%'
        AND TRIM(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g')) != ''  -- Must have letters
    ON CONFLICT (canonical_name) DO NOTHING;
    
    GET DIAGNOSTICS ingredient_count = ROW_COUNT;
    
    -- Update migration status
    UPDATE migration_status 
    SET records_processed = ingredient_count,
        total_records = total_recipe_ingredients
    WHERE id = (
        SELECT id FROM migration_status
        WHERE phase = 'Phase 3' 
          AND step = 'Ingredient Taxonomy Creation' 
          AND status = 'in_progress'
        ORDER BY started_at DESC 
        LIMIT 1
    );
    
    RAISE NOTICE '✅ Extracted % unique ingredients from % recipe entries', ingredient_count, total_recipe_ingredients;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: AUTO-CATEGORIZE COMMON INGREDIENTS
-- ============================================================================

DO $$
DECLARE
    categorized_count INT := 0;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 2: AUTO-CATEGORIZING COMMON INGREDIENTS';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Categorize common proteins
    UPDATE ingredients SET 
        category = 'protein',
        subcategory = 'poultry'
    WHERE canonical_name IN ('egg', 'eggs', 'chicken', 'chicken breast', 'chicken thigh', 'turkey', 'duck')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'protein',
        subcategory = 'beef'
    WHERE canonical_name IN ('beef', 'ground beef', 'steak', 'brisket', 'beef broth')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'protein',
        subcategory = 'pork'
    WHERE canonical_name IN ('pork', 'bacon', 'ham', 'sausage', 'pork chop')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'protein',
        subcategory = 'fish'
    WHERE canonical_name IN ('salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'crab')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'protein',
        subcategory = 'legume'
    WHERE canonical_name IN ('beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans', 'tofu')
    AND category = 'unknown';
    
    -- Categorize dairy
    UPDATE ingredients SET 
        category = 'dairy',
        subcategory = 'milk'
    WHERE canonical_name IN ('milk', 'whole milk', 'skim milk', 'buttermilk', 'cream', 'heavy cream', 'half and half')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'dairy',
        subcategory = 'cheese'
    WHERE canonical_name IN ('cheese', 'cheddar', 'mozzarella', 'parmesan', 'cream cheese', 'feta', 'goat cheese')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'dairy',
        subcategory = 'yogurt'
    WHERE canonical_name IN ('yogurt', 'greek yogurt', 'plain yogurt', 'sour cream')
    AND category = 'unknown';
    
    -- Categorize vegetables
    UPDATE ingredients SET 
        category = 'vegetable',
        subcategory = 'leafy_green'
    WHERE canonical_name IN ('spinach', 'lettuce', 'kale', 'arugula', 'chard', 'cabbage')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'vegetable',
        subcategory = 'root'
    WHERE canonical_name IN ('carrot', 'carrots', 'potato', 'potatoes', 'sweet potato', 'onion', 'onions', 'garlic', 'ginger')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'vegetable',
        subcategory = 'nightshade'
    WHERE canonical_name IN ('eggplant', 'tomato', 'tomatoes', 'bell pepper', 'peppers', 'chili')
    AND category = 'unknown';
    
    -- Categorize fruits
    UPDATE ingredients SET 
        category = 'fruit',
        subcategory = 'citrus'
    WHERE canonical_name IN ('lemon', 'lime', 'orange', 'grapefruit', 'lemon juice', 'lime juice')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'fruit',
        subcategory = 'berry'
    WHERE canonical_name IN ('strawberry', 'strawberries', 'blueberry', 'blueberries', 'raspberry', 'raspberries', 'blackberry')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'fruit',
        subcategory = 'pomefruit'
    WHERE canonical_name IN ('apple', 'apples', 'pear', 'pears')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'fruit',
        subcategory = 'tropical'
    WHERE canonical_name IN ('banana', 'bananas', 'mango', 'pineapple', 'coconut', 'avocado')
    AND category = 'unknown';
    
    -- Categorize grains
    UPDATE ingredients SET 
        category = 'grain',
        subcategory = 'whole_grain'
    WHERE canonical_name IN ('rice', 'brown rice', 'quinoa', 'oats', 'barley', 'wheat')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'grain',
        subcategory = 'pasta'
    WHERE canonical_name IN ('pasta', 'spaghetti', 'noodles', 'macaroni', 'penne')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'grain',
        subcategory = 'bread'
    WHERE canonical_name IN ('bread', 'baguette', 'tortilla', 'pita', 'breadcrumbs')
    AND category = 'unknown';
    
    -- Categorize sweeteners
    UPDATE ingredients SET 
        category = 'sweetener',
        subcategory = 'sugar'
    WHERE canonical_name IN ('sugar', 'brown sugar', 'powdered sugar', 'granulated sugar', 'confectioners sugar')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'sweetener',
        subcategory = 'syrup'
    WHERE canonical_name IN ('honey', 'maple syrup', 'agave', 'corn syrup', 'molasses')
    AND category = 'unknown';
    
    -- Categorize fats/oils
    UPDATE ingredients SET 
        category = 'fat',
        subcategory = 'oil'
    WHERE canonical_name IN ('oil', 'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'fat',
        subcategory = 'solid'
    WHERE canonical_name IN ('butter', 'margarine', 'shortening', 'lard')
    AND category = 'unknown';
    
    -- Categorize spices and herbs
    UPDATE ingredients SET 
        category = 'spice',
        subcategory = 'herb'
    WHERE canonical_name IN ('basil', 'oregano', 'thyme', 'rosemary', 'cilantro', 'parsley', 'mint', 'sage', 'dill')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'spice',
        subcategory = 'spice'
    WHERE canonical_name IN ('salt', 'pepper', 'black pepper', 'cumin', 'paprika', 'cinnamon', 'nutmeg', 'ginger', 'turmeric', 'cayenne')
    AND category = 'unknown';
    
    -- Categorize nuts and seeds
    UPDATE ingredients SET 
        category = 'nut',
        subcategory = 'tree_nut'
    WHERE canonical_name IN ('almond', 'almonds', 'walnut', 'walnuts', 'pecan', 'pecans', 'cashew', 'cashews', 'pistachio')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'nut',
        subcategory = 'seed'
    WHERE canonical_name IN ('sesame', 'sunflower seed', 'pumpkin seed', 'flax seed', 'chia seed')
    AND category = 'unknown';
    
    -- Categorize condiments
    UPDATE ingredients SET 
        category = 'condiment',
        subcategory = 'sauce'
    WHERE canonical_name IN ('soy sauce', 'worcestershire sauce', 'hot sauce', 'ketchup', 'mustard', 'mayonnaise', 'vinegar')
    AND category = 'unknown';
    
    -- Categorize liquids
    UPDATE ingredients SET 
        category = 'liquid',
        subcategory = 'water'
    WHERE canonical_name IN ('water', 'ice', 'ice water')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'liquid',
        subcategory = 'broth'
    WHERE canonical_name IN ('broth', 'chicken broth', 'beef broth', 'vegetable broth', 'stock')
    AND category = 'unknown';
    
    -- Categorize baking ingredients
    UPDATE ingredients SET 
        category = 'baking',
        subcategory = 'flour'
    WHERE canonical_name IN ('flour', 'all-purpose flour', 'bread flour', 'cake flour', 'whole wheat flour')
    AND category = 'unknown';
    
    UPDATE ingredients SET 
        category = 'baking',
        subcategory = 'leavening'
    WHERE canonical_name IN ('baking powder', 'baking soda', 'yeast', 'baking powder', 'baking soda')
    AND category = 'unknown';
    
    GET DIAGNOSTICS categorized_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Auto-categorized % common ingredients', categorized_count;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: ADD COMMON ALLERGEN INFORMATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 3: ADDING ALLERGEN INFORMATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Mark common allergens
    UPDATE ingredients SET 
        allergens = ARRAY['egg'],
        is_common_allergen = true
    WHERE canonical_name IN ('egg', 'eggs', 'egg white', 'egg yolk');
    
    UPDATE ingredients SET 
        allergens = ARRAY['milk'],
        is_common_allergen = true
    WHERE canonical_name IN ('milk', 'cream', 'butter', 'cheese', 'yogurt');
    
    UPDATE ingredients SET 
        allergens = ARRAY['peanut'],
        is_common_allergen = true
    WHERE canonical_name IN ('peanut', 'peanuts', 'peanut butter');
    
    UPDATE ingredients SET 
        allergens = ARRAY['tree_nut'],
        is_common_allergen = true
    WHERE canonical_name IN ('almond', 'almonds', 'walnut', 'walnuts', 'pecan', 'pecans', 'cashew', 'cashews');
    
    UPDATE ingredients SET 
        allergens = ARRAY['soy'],
        is_common_allergen = true
    WHERE canonical_name IN ('soy', 'soy sauce', 'tofu', 'edamame');
    
    UPDATE ingredients SET 
        allergens = ARRAY['wheat'],
        is_common_allergen = true
    WHERE canonical_name IN ('wheat', 'flour', 'bread', 'pasta', 'noodles');
    
    UPDATE ingredients SET 
        allergens = ARRAY['fish'],
        is_common_allergen = true
    WHERE canonical_name IN ('fish', 'salmon', 'tuna', 'cod', 'tilapia');
    
    UPDATE ingredients SET 
        allergens = ARRAY['shellfish'],
        is_common_allergen = true
    WHERE canonical_name IN ('shrimp', 'crab', 'lobster', 'clam', 'oyster', 'scallop');
    
    UPDATE ingredients SET 
        allergens = ARRAY['sesame'],
        is_common_allergen = true
    WHERE canonical_name IN ('sesame', 'sesame seed', 'tahini');
    
    RAISE NOTICE '✅ Added allergen information to common ingredients';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 4: ADD ALIASES FOR COMMON VARIATIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 4: ADDING ALIASES FOR VARIATIONS';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Add aliases for eggs
    UPDATE ingredients SET aliases = ARRAY['eggs', 'whole egg', 'chicken egg', 'large egg'] 
    WHERE canonical_name = 'egg';
    
    -- Add aliases for vegetables
    UPDATE ingredients SET aliases = ARRAY['aubergine', 'brinjal'] 
    WHERE canonical_name = 'eggplant';
    
    UPDATE ingredients SET aliases = ARRAY['cilantro', 'chinese parsley'] 
    WHERE canonical_name = 'coriander';
    
    UPDATE ingredients SET aliases = ARRAY['green onion', 'spring onion'] 
    WHERE canonical_name = 'scallion';
    
    UPDATE ingredients SET aliases = ARRAY['zucchini', 'courgette'] 
    WHERE canonical_name IN ('zucchini', 'courgette');
    
    -- Add aliases for grains
    UPDATE ingredients SET aliases = ARRAY['spaghetti', 'linguine', 'fettuccine', 'penne', 'rigatoni'] 
    WHERE canonical_name = 'pasta';
    
    UPDATE ingredients SET aliases = ARRAY['white rice', 'jasmine rice', 'basmati rice', 'long grain rice'] 
    WHERE canonical_name = 'rice';
    
    -- Add aliases for dairy
    UPDATE ingredients SET aliases = ARRAY['whole milk', 'skim milk', '2% milk', 'low-fat milk'] 
    WHERE canonical_name = 'milk';
    
    UPDATE ingredients SET aliases = ARRAY['cheddar cheese', 'mozzarella cheese', 'swiss cheese'] 
    WHERE canonical_name = 'cheese';
    
    RAISE NOTICE '✅ Added aliases for common ingredient variations';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 5: MARK COMPLETION
-- ============================================================================

DO $$
DECLARE
    total_ingredients INT;
    categorized INT;
    unknown INT;
    with_allergens INT;
    with_aliases INT;
BEGIN
    -- Get statistics
    SELECT COUNT(*) INTO total_ingredients FROM ingredients;
    SELECT COUNT(*) INTO categorized FROM ingredients WHERE category != 'unknown';
    SELECT COUNT(*) INTO unknown FROM ingredients WHERE category = 'unknown';
    SELECT COUNT(*) INTO with_allergens FROM ingredients WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0;
    SELECT COUNT(*) INTO with_aliases FROM ingredients WHERE aliases IS NOT NULL AND array_length(aliases, 1) > 0;
    
    -- Mark as completed
    UPDATE migration_status 
    SET status = 'completed', 
        completed_at = NOW(),
        records_processed = total_ingredients
    WHERE id = (
        SELECT id FROM migration_status
        WHERE phase = 'Phase 3' 
          AND step = 'Ingredient Taxonomy Creation'
        ORDER BY started_at DESC 
        LIMIT 1
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ PHASE 3 COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total ingredients created: %', total_ingredients;
    RAISE NOTICE 'Categorized: % (%% of total)', categorized, ROUND((categorized::NUMERIC / total_ingredients * 100)::NUMERIC, 1);
    RAISE NOTICE 'Still unknown: % (%% of total)', unknown, ROUND((unknown::NUMERIC / total_ingredients * 100)::NUMERIC, 1);
    RAISE NOTICE 'With allergen info: %', with_allergens;
    RAISE NOTICE 'With aliases: %', with_aliases;
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show sample ingredients by category
SELECT 
    'Ingredient Taxonomy Summary' as report,
    category,
    COUNT(*) as ingredient_count,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as with_allergens,
    COUNT(CASE WHEN aliases IS NOT NULL AND array_length(aliases, 1) > 0 THEN 1 END) as with_aliases
FROM ingredients
GROUP BY category
ORDER BY ingredient_count DESC;

-- Show sample categorized ingredients
SELECT 
    canonical_name,
    category,
    subcategory,
    allergens,
    aliases
FROM ingredients
WHERE category != 'unknown'
ORDER BY canonical_name
LIMIT 20;

-- Show most common unknown ingredients (need manual categorization)
SELECT 
    canonical_name,
    COUNT(*) as usage_count
FROM ingredients i
JOIN "RecipeIngredients" ri ON LOWER(TRIM(ri.name)) ILIKE '%' || i.canonical_name || '%'
WHERE i.category = 'unknown'
GROUP BY canonical_name
ORDER BY usage_count DESC
LIMIT 50;

-- ============================================================================
-- NOTES FOR NEXT STEPS
-- ============================================================================

-- Phase 3 is now complete! Next steps:
-- 
-- Phase 4 (Week 4-5): Create product-ingredient mappings
--   - This is where we fix the eggplant/egg issue!
--   - Run: database/migrations/phase4_create_mappings.sql
-- 
-- Website Status: ✅ STILL WORKS - Application uses old IngredientCategorized table
-- 
-- Optional Enhancement:
--   - Import USDA taxonomy to categorize more ingredients
--   - Run: scripts/import_usda_taxonomy.js

