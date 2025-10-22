-- ============================================================================
-- DYNABLE DATABASE MIGRATION: PHASE 3 (OPTIMIZED)
-- ============================================================================
-- Purpose: Build ingredient taxonomy from 683,784 recipe ingredients
-- Optimization: Process in batches to prevent timeout
-- Date: 2025-10-22
-- ============================================================================

-- Log Phase 3 start
INSERT INTO public.migration_status (phase, step, status, started_at)
VALUES ('Phase 3', 'Ingredient Taxonomy Creation', 'in_progress', NOW());

-- ============================================================================
-- STEP 1: EXTRACT AND CLEAN INGREDIENT NAMES (BATCHED)
-- ============================================================================

DO $$
DECLARE
    batch_size INT := 50000;
    offset_val INT := 0;
    total_count INT;
    inserted_count INT := 0;
    batch_num INT := 0;
BEGIN
    SELECT COUNT(*) INTO total_count FROM "RecipeIngredients";
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PHASE 3: INGREDIENT TAXONOMY CREATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total recipe ingredient entries: %', total_count;
    RAISE NOTICE 'Processing in batches of %...', batch_size;
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Create temporary table for cleaned ingredients
    CREATE TEMP TABLE cleaned_ingredients (
        canonical_name VARCHAR(100) PRIMARY KEY
    );
    
    -- Process in batches to avoid timeout
    WHILE offset_val < total_count LOOP
        batch_num := batch_num + 1;
        
        RAISE NOTICE 'Processing batch % (% to %)...', batch_num, offset_val, offset_val + batch_size;
        
        -- Insert into temp table (deduplicates automatically)
        INSERT INTO cleaned_ingredients (canonical_name)
        SELECT DISTINCT
            LEFT(
                LOWER(
                    TRIM(
                        REGEXP_REPLACE(
                            REGEXP_REPLACE(
                                REGEXP_REPLACE(
                                    REGEXP_REPLACE(
                                        REGEXP_REPLACE(
                                            name,
                                            '^\d+(/\d+)?\s*(cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|pound|pounds|ounce|ounces|oz|lb|tsp|tbsp|c\.)\s*', 
                                            '', 
                                            'i'
                                        ),
                                        '\s*-\s*(peeled|chopped|diced|minced|sliced|cubed|crushed|ground|shredded|grated).*$',
                                        '',
                                        'i'
                                    ),
                                    '\s*,\s*(or as needed|to taste|optional|if desired).*$',
                                    '',
                                    'i'
                                ),
                                '\s*\(.*?\)',
                                '',
                                'g'
                            ),
                            '[*\[\]]',
                            '',
                            'g'
                        )
                    )
                ),
                100
            ) as canonical_name
        FROM (
            SELECT name 
            FROM "RecipeIngredients"
            WHERE 
                LENGTH(TRIM(name)) > 2
                AND name NOT ILIKE '%cup%'
                AND name NOT ILIKE '%tablespoon%'
                AND name NOT ILIKE '%teaspoon%'
            ORDER BY id
            LIMIT batch_size OFFSET offset_val
        ) AS batch
        ON CONFLICT (canonical_name) DO NOTHING;
        
        offset_val := offset_val + batch_size;
        
        RAISE NOTICE '  Processed batch %', batch_num;
    END LOOP;
    
    -- Now insert from temp table to ingredients table
    INSERT INTO ingredients (canonical_name, category, subcategory, is_basic_ingredient)
    SELECT 
        canonical_name,
        'unknown' as category,
        NULL as subcategory,
        true as is_basic_ingredient
    FROM cleaned_ingredients
    WHERE canonical_name IS NOT NULL 
      AND LENGTH(canonical_name) > 0
      AND canonical_name != ''
    ON CONFLICT (canonical_name) DO NOTHING;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    DROP TABLE cleaned_ingredients;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Extracted % unique ingredients from % recipe entries', inserted_count, total_count;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: AUTO-CATEGORIZE COMMON INGREDIENTS (FAST - NO TIMEOUT RISK)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 2: AUTO-CATEGORIZING COMMON INGREDIENTS';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Proteins - Poultry
    UPDATE ingredients SET category = 'protein', subcategory = 'poultry'
    WHERE canonical_name IN ('egg', 'eggs', 'chicken', 'chicken breast', 'chicken thigh', 'turkey', 'duck')
    AND category = 'unknown';
    
    -- Proteins - Beef
    UPDATE ingredients SET category = 'protein', subcategory = 'beef'
    WHERE canonical_name IN ('beef', 'ground beef', 'steak', 'brisket', 'beef broth')
    AND category = 'unknown';
    
    -- Proteins - Pork
    UPDATE ingredients SET category = 'protein', subcategory = 'pork'
    WHERE canonical_name IN ('pork', 'bacon', 'ham', 'sausage', 'pork chop')
    AND category = 'unknown';
    
    -- Proteins - Fish
    UPDATE ingredients SET category = 'protein', subcategory = 'fish'
    WHERE canonical_name IN ('salmon', 'tuna', 'cod', 'tilapia', 'shrimp', 'crab')
    AND category = 'unknown';
    
    -- Proteins - Legume
    UPDATE ingredients SET category = 'protein', subcategory = 'legume'
    WHERE canonical_name IN ('beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans', 'tofu')
    AND category = 'unknown';
    
    -- Dairy - Milk
    UPDATE ingredients SET category = 'dairy', subcategory = 'milk'
    WHERE canonical_name IN ('milk', 'whole milk', 'skim milk', 'buttermilk', 'cream', 'heavy cream')
    AND category = 'unknown';
    
    -- Dairy - Cheese
    UPDATE ingredients SET category = 'dairy', subcategory = 'cheese'
    WHERE canonical_name IN ('cheese', 'cheddar', 'mozzarella', 'parmesan', 'cream cheese', 'feta')
    AND category = 'unknown';
    
    -- Dairy - Yogurt
    UPDATE ingredients SET category = 'dairy', subcategory = 'yogurt'
    WHERE canonical_name IN ('yogurt', 'greek yogurt', 'plain yogurt', 'sour cream')
    AND category = 'unknown';
    
    -- Vegetables - Leafy Green
    UPDATE ingredients SET category = 'vegetable', subcategory = 'leafy_green'
    WHERE canonical_name IN ('spinach', 'lettuce', 'kale', 'arugula', 'chard', 'cabbage')
    AND category = 'unknown';
    
    -- Vegetables - Root
    UPDATE ingredients SET category = 'vegetable', subcategory = 'root'
    WHERE canonical_name IN ('carrot', 'carrots', 'potato', 'potatoes', 'sweet potato', 'onion', 'onions', 'garlic', 'ginger')
    AND category = 'unknown';
    
    -- Vegetables - Nightshade (INCLUDES EGGPLANT!)
    UPDATE ingredients SET category = 'vegetable', subcategory = 'nightshade'
    WHERE canonical_name IN ('eggplant', 'tomato', 'tomatoes', 'bell pepper', 'peppers', 'chili')
    AND category = 'unknown';
    
    -- Fruits - Citrus
    UPDATE ingredients SET category = 'fruit', subcategory = 'citrus'
    WHERE canonical_name IN ('lemon', 'lime', 'orange', 'grapefruit', 'lemon juice', 'lime juice')
    AND category = 'unknown';
    
    -- Fruits - Berry
    UPDATE ingredients SET category = 'fruit', subcategory = 'berry'
    WHERE canonical_name IN ('strawberry', 'strawberries', 'blueberry', 'blueberries', 'raspberry', 'raspberries')
    AND category = 'unknown';
    
    -- Fruits - Pomefruit
    UPDATE ingredients SET category = 'fruit', subcategory = 'pomefruit'
    WHERE canonical_name IN ('apple', 'apples', 'pear', 'pears')
    AND category = 'unknown';
    
    -- Fruits - Tropical
    UPDATE ingredients SET category = 'fruit', subcategory = 'tropical'
    WHERE canonical_name IN ('banana', 'bananas', 'mango', 'pineapple', 'coconut', 'avocado')
    AND category = 'unknown';
    
    -- Grains - Whole Grain
    UPDATE ingredients SET category = 'grain', subcategory = 'whole_grain'
    WHERE canonical_name IN ('rice', 'brown rice', 'quinoa', 'oats', 'barley', 'wheat')
    AND category = 'unknown';
    
    -- Grains - Pasta
    UPDATE ingredients SET category = 'grain', subcategory = 'pasta'
    WHERE canonical_name IN ('pasta', 'spaghetti', 'noodles', 'macaroni', 'penne')
    AND category = 'unknown';
    
    -- Grains - Bread
    UPDATE ingredients SET category = 'grain', subcategory = 'bread'
    WHERE canonical_name IN ('bread', 'baguette', 'tortilla', 'pita', 'breadcrumbs')
    AND category = 'unknown';
    
    -- Sweeteners - Sugar
    UPDATE ingredients SET category = 'sweetener', subcategory = 'sugar'
    WHERE canonical_name IN ('sugar', 'brown sugar', 'powdered sugar', 'granulated sugar')
    AND category = 'unknown';
    
    -- Sweeteners - Syrup
    UPDATE ingredients SET category = 'sweetener', subcategory = 'syrup'
    WHERE canonical_name IN ('honey', 'maple syrup', 'agave', 'corn syrup', 'molasses')
    AND category = 'unknown';
    
    -- Fats - Oil
    UPDATE ingredients SET category = 'fat', subcategory = 'oil'
    WHERE canonical_name IN ('oil', 'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil')
    AND category = 'unknown';
    
    -- Fats - Solid
    UPDATE ingredients SET category = 'fat', subcategory = 'solid'
    WHERE canonical_name IN ('butter', 'margarine', 'shortening', 'lard')
    AND category = 'unknown';
    
    -- Spices - Herbs
    UPDATE ingredients SET category = 'spice', subcategory = 'herb'
    WHERE canonical_name IN ('basil', 'oregano', 'thyme', 'rosemary', 'cilantro', 'parsley', 'mint', 'sage', 'dill')
    AND category = 'unknown';
    
    -- Spices - Spices
    UPDATE ingredients SET category = 'spice', subcategory = 'spice'
    WHERE canonical_name IN ('salt', 'pepper', 'black pepper', 'cumin', 'paprika', 'cinnamon', 'nutmeg', 'turmeric')
    AND category = 'unknown';
    
    -- Nuts - Tree Nuts
    UPDATE ingredients SET category = 'nut', subcategory = 'tree_nut'
    WHERE canonical_name IN ('almond', 'almonds', 'walnut', 'walnuts', 'pecan', 'pecans', 'cashew', 'cashews')
    AND category = 'unknown';
    
    -- Nuts - Seeds
    UPDATE ingredients SET category = 'nut', subcategory = 'seed'
    WHERE canonical_name IN ('sesame', 'sunflower seed', 'pumpkin seed', 'flax seed', 'chia seed')
    AND category = 'unknown';
    
    -- Condiments
    UPDATE ingredients SET category = 'condiment', subcategory = 'sauce'
    WHERE canonical_name IN ('soy sauce', 'worcestershire sauce', 'hot sauce', 'ketchup', 'mustard', 'mayonnaise', 'vinegar')
    AND category = 'unknown';
    
    -- Liquids
    UPDATE ingredients SET category = 'liquid', subcategory = 'water'
    WHERE canonical_name IN ('water', 'ice', 'ice water')
    AND category = 'unknown';
    
    UPDATE ingredients SET category = 'liquid', subcategory = 'broth'
    WHERE canonical_name IN ('broth', 'chicken broth', 'beef broth', 'vegetable broth', 'stock')
    AND category = 'unknown';
    
    -- Baking
    UPDATE ingredients SET category = 'baking', subcategory = 'flour'
    WHERE canonical_name IN ('flour', 'all-purpose flour', 'bread flour', 'cake flour')
    AND category = 'unknown';
    
    UPDATE ingredients SET category = 'baking', subcategory = 'leavening'
    WHERE canonical_name IN ('baking powder', 'baking soda', 'yeast')
    AND category = 'unknown';
    
    RAISE NOTICE '✅ Auto-categorized common ingredients';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: ADD ALLERGEN INFORMATION (FAST)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 3: ADDING ALLERGEN INFORMATION';
    RAISE NOTICE '============================================';
    
    UPDATE ingredients SET allergens = ARRAY['egg'], is_common_allergen = true
    WHERE canonical_name IN ('egg', 'eggs', 'egg white', 'egg yolk');
    
    UPDATE ingredients SET allergens = ARRAY['milk'], is_common_allergen = true
    WHERE canonical_name IN ('milk', 'cream', 'butter', 'cheese', 'yogurt');
    
    UPDATE ingredients SET allergens = ARRAY['peanut'], is_common_allergen = true
    WHERE canonical_name IN ('peanut', 'peanuts', 'peanut butter');
    
    UPDATE ingredients SET allergens = ARRAY['tree_nut'], is_common_allergen = true
    WHERE canonical_name IN ('almond', 'almonds', 'walnut', 'walnuts', 'pecan', 'pecans', 'cashew', 'cashews');
    
    UPDATE ingredients SET allergens = ARRAY['soy'], is_common_allergen = true
    WHERE canonical_name IN ('soy', 'soy sauce', 'tofu', 'edamame');
    
    UPDATE ingredients SET allergens = ARRAY['wheat'], is_common_allergen = true
    WHERE canonical_name IN ('wheat', 'flour', 'bread', 'pasta', 'noodles');
    
    UPDATE ingredients SET allergens = ARRAY['fish'], is_common_allergen = true
    WHERE canonical_name IN ('fish', 'salmon', 'tuna', 'cod', 'tilapia');
    
    UPDATE ingredients SET allergens = ARRAY['shellfish'], is_common_allergen = true
    WHERE canonical_name IN ('shrimp', 'crab', 'lobster', 'clam', 'oyster');
    
    UPDATE ingredients SET allergens = ARRAY['sesame'], is_common_allergen = true
    WHERE canonical_name IN ('sesame', 'sesame seed', 'tahini');
    
    RAISE NOTICE '✅ Added allergen information';
END $$;

-- ============================================================================
-- STEP 4: ADD ALIASES (FAST)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'STEP 4: ADDING ALIASES';
    RAISE NOTICE '============================================';
    
    -- Critical: Add aliases for egg (vs eggplant)
    UPDATE ingredients SET aliases = ARRAY['eggs', 'whole egg', 'chicken egg', 'large egg'] 
    WHERE canonical_name = 'egg';
    
    -- Critical: Add aliases for eggplant
    UPDATE ingredients SET aliases = ARRAY['aubergine', 'brinjal'] 
    WHERE canonical_name = 'eggplant';
    
    -- Common variations
    UPDATE ingredients SET aliases = ARRAY['cilantro', 'chinese parsley'] 
    WHERE canonical_name = 'coriander';
    
    UPDATE ingredients SET aliases = ARRAY['green onion', 'spring onion'] 
    WHERE canonical_name = 'scallion';
    
    UPDATE ingredients SET aliases = ARRAY['whole milk', 'skim milk', '2% milk'] 
    WHERE canonical_name = 'milk';
    
    RAISE NOTICE '✅ Added aliases';
END $$;

-- ============================================================================
-- STEP 5: MARK COMPLETION
-- ============================================================================

DO $$
DECLARE
    total_ingredients INT;
    categorized INT;
    unknown INT;
BEGIN
    SELECT COUNT(*) INTO total_ingredients FROM ingredients;
    SELECT COUNT(*) INTO categorized FROM ingredients WHERE category != 'unknown';
    SELECT COUNT(*) INTO unknown FROM ingredients WHERE category = 'unknown';
    
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
    RAISE NOTICE 'Total ingredients: %', total_ingredients;
    RAISE NOTICE 'Categorized: %', categorized;
    RAISE NOTICE 'Still unknown: %', unknown;
    RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
    category,
    COUNT(*) as count
FROM ingredients
GROUP BY category
ORDER BY count DESC;

-- Check egg vs eggplant
SELECT canonical_name, category, subcategory, allergens
FROM ingredients
WHERE canonical_name IN ('egg', 'eggplant')
ORDER BY canonical_name;

