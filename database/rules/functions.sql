-- 🔧 DATABASE FUNCTIONS FOR ALLERGEN RULES
-- Dynable App - Data Quality Functions

-- Function to convert text to camelCase
CREATE OR REPLACE FUNCTION to_camel_case(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    words TEXT[];
    result TEXT := '';
    word TEXT;
    i INTEGER;
BEGIN
    -- Handle null or empty input
    IF input_text IS NULL OR trim(input_text) = '' THEN
        RETURN '';
    END IF;
    
    -- Replace underscores and hyphens with spaces, then split
    words := string_to_array(
        regexp_replace(
            lower(trim(input_text)), 
            '[_-]+', 
            ' ', 
            'g'
        ), 
        ' '
    );
    
    -- Build camelCase result
    FOR i IN 1..array_length(words, 1) LOOP
        word := trim(words[i]);
        IF word != '' THEN
            IF result = '' THEN
                -- First word: lowercase
                result := word;
            ELSE
                -- Subsequent words: capitalize first letter
                result := result || upper(left(word, 1)) || substring(word, 2);
            END IF;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to standardize allergen names (convert to camelCase)
CREATE OR REPLACE FUNCTION standardize_allergen_name(allergen_input TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned_input TEXT;
    result TEXT;
BEGIN
    -- Clean input: lowercase, remove extra spaces
    cleaned_input := lower(trim(regexp_replace(allergen_input, '\s+', ' ', 'g')));
    
    -- Apply universal camelCase conversion to ALL multi-word allergens
    -- This ensures ANY multi-word allergen becomes camelCase
    result := to_camel_case(cleaned_input);
    
    -- Apply specific mappings for common variations
    result := CASE cleaned_input
        -- Tree nuts variations → treeNuts
        WHEN 'tree nuts', 'tree_nuts', 'tree-nuts', 'treenuts', 'nuts' THEN 'treeNuts'
        
        -- Free-from variations
        WHEN 'gluten free', 'gluten_free', 'gluten-free', 'glutenfree' THEN 'glutenFree'
        WHEN 'dairy free', 'dairy_free', 'dairy-free', 'dairyfree' THEN 'dairyFree'
        WHEN 'egg free', 'egg_free', 'egg-free', 'eggfree' THEN 'eggFree'
        WHEN 'soy free', 'soy_free', 'soy-free', 'soyfree' THEN 'soyFree'
        WHEN 'nut free', 'nut_free', 'nut-free', 'nutfree' THEN 'nutFree'
        WHEN 'fish free', 'fish_free', 'fish-free', 'fishfree' THEN 'fishFree'
        
        -- Common multi-word allergens (universal camelCase)
        WHEN 'bell pepper', 'bell_pepper', 'bell-pepper' THEN 'bellPepper'
        WHEN 'black pepper', 'black_pepper', 'black-pepper' THEN 'blackPepper'
        WHEN 'hot sauce', 'hot_sauce', 'hot-sauce' THEN 'hotSauce'
        WHEN 'coconut oil', 'coconut_oil', 'coconut-oil' THEN 'coconutOil'
        WHEN 'palm oil', 'palm_oil', 'palm-oil' THEN 'palmOil'
        WHEN 'sunflower oil', 'sunflower_oil', 'sunflower-oil' THEN 'sunflowerOil'
        WHEN 'vegetable oil', 'vegetable_oil', 'vegetable-oil' THEN 'vegetableOil'
        WHEN 'olive oil', 'olive_oil', 'olive-oil' THEN 'oliveOil'
        WHEN 'avocado oil', 'avocado_oil', 'avocado-oil' THEN 'avocadoOil'
        WHEN 'kiwi fruit', 'kiwi_fruit', 'kiwi-fruit' THEN 'kiwiFruit'
        WHEN 'dragon fruit', 'dragon_fruit', 'dragon-fruit' THEN 'dragonFruit'
        WHEN 'passion fruit', 'passion_fruit', 'passion-fruit' THEN 'passionFruit'
        WHEN 'sweet potatoes', 'sweet_potatoes', 'sweet-potatoes' THEN 'sweetPotatoes'
        WHEN 'yellow squash', 'yellow_squash', 'yellow-squash' THEN 'yellowSquash'
        WHEN 'butternut squash', 'butternut_squash', 'butternut-squash' THEN 'butternutSquash'
        WHEN 'green beans', 'green_beans', 'green-beans' THEN 'greenBeans'
        WHEN 'black beans', 'black_beans', 'black-beans' THEN 'blackBeans'
        WHEN 'pinto beans', 'pinto_beans', 'pinto-beans' THEN 'pintoBeans'
        WHEN 'kidney beans', 'kidney_beans', 'kidney-beans' THEN 'kidneyBeans'
        WHEN 'navy beans', 'navy_beans', 'navy-beans' THEN 'navyBeans'
        WHEN 'black eyed peas', 'black_eyed_peas', 'black-eyed-peas' THEN 'blackEyedPeas'
        WHEN 'split peas', 'split_peas', 'split-peas' THEN 'splitPeas'
        WHEN 'brown rice', 'brown_rice', 'brown-rice' THEN 'brownRice'
        WHEN 'white rice', 'white_rice', 'white-rice' THEN 'whiteRice'
        WHEN 'wild rice', 'wild_rice', 'wild-rice' THEN 'wildRice'
        WHEN 'greek yogurt', 'greek_yogurt', 'greek-yogurt' THEN 'greekYogurt'
        WHEN 'sour cream', 'sour_cream', 'sour-cream' THEN 'sourCream'
        WHEN 'heavy cream', 'heavy_cream', 'heavy-cream' THEN 'heavyCream'
        WHEN 'half and half', 'half_and_half', 'half-and-half' THEN 'halfAndHalf'
        WHEN 'whole milk', 'whole_milk', 'whole-milk' THEN 'wholeMilk'
        WHEN 'skim milk', 'skim_milk', 'skim-milk' THEN 'skimMilk'
        WHEN 'almond milk', 'almond_milk', 'almond-milk' THEN 'almondMilk'
        WHEN 'soy milk', 'soy_milk', 'soy-milk' THEN 'soyMilk'
        WHEN 'oat milk', 'oat_milk', 'oat-milk' THEN 'oatMilk'
        WHEN 'coconut milk', 'coconut_milk', 'coconut-milk' THEN 'coconutMilk'
        WHEN 'rice milk', 'rice_milk', 'rice-milk' THEN 'riceMilk'
        WHEN 'energy drinks', 'energy_drinks', 'energy-drinks' THEN 'energyDrinks'
        WHEN 'sports drinks', 'sports_drinks', 'sports-drinks' THEN 'sportsDrinks'
        WHEN 'artificial colors', 'artificial_colors', 'artificial-colors' THEN 'artificialColors'
        WHEN 'food dyes', 'food_dyes', 'food-dyes' THEN 'foodDyes'
        WHEN 'citric acid', 'citric_acid', 'citric-acid' THEN 'citricAcid'
        WHEN 'vanilla extract', 'vanilla_extract', 'vanilla-extract' THEN 'vanillaExtract'
        
        -- Single allergens (keep as-is)
        WHEN 'milk', 'eggs', 'fish', 'shellfish', 'peanuts', 'wheat', 'soy', 'sesame', 
             'gluten', 'lactose', 'garlic', 'tomatoes', 'onions', 'corn', 'mustard', 
             'celery', 'chocolate', 'strawberries', 'peaches' THEN cleaned_input
        
        -- For any other multi-word allergen, apply universal camelCase
        ELSE to_camel_case(cleaned_input)
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to clean free-from contradictions
CREATE OR REPLACE FUNCTION clean_free_from_contradictions(allergens TEXT[], description TEXT)
RETURNS TEXT[] AS $$
DECLARE
    cleaned_allergens TEXT[];
    allergen TEXT;
    description_lower TEXT;
BEGIN
    -- Convert description to lowercase for matching
    description_lower := lower(description);
    cleaned_allergens := allergens;
    
    -- Remove contradictory allergens based on "free from" claims
    
    -- Gluten free
    IF description_lower LIKE '%gluten free%' OR description_lower LIKE '%gluten-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'gluten');
        cleaned_allergens := array_remove(cleaned_allergens, 'wheat');
    END IF;
    
    -- Dairy free
    IF description_lower LIKE '%dairy free%' OR description_lower LIKE '%dairy-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'milk');
        cleaned_allergens := array_remove(cleaned_allergens, 'lactose');
    END IF;
    
    -- Nut free
    IF description_lower LIKE '%nut free%' OR description_lower LIKE '%nut-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'treeNuts');
        cleaned_allergens := array_remove(cleaned_allergens, 'peanuts');
    END IF;
    
    -- Tree nut free
    IF description_lower LIKE '%tree nut free%' OR description_lower LIKE '%tree-nut-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'treeNuts');
    END IF;
    
    -- Peanut free
    IF description_lower LIKE '%peanut free%' OR description_lower LIKE '%peanut-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'peanuts');
    END IF;
    
    -- Egg free
    IF description_lower LIKE '%egg free%' OR description_lower LIKE '%egg-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'eggs');
    END IF;
    
    -- Soy free
    IF description_lower LIKE '%soy free%' OR description_lower LIKE '%soy-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'soy');
    END IF;
    
    -- Fish free
    IF description_lower LIKE '%fish free%' OR description_lower LIKE '%fish-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'fish');
        cleaned_allergens := array_remove(cleaned_allergens, 'shellfish');
    END IF;
    
    -- Shellfish free
    IF description_lower LIKE '%shellfish free%' OR description_lower LIKE '%shellfish-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'shellfish');
    END IF;
    
    -- Sesame free
    IF description_lower LIKE '%sesame free%' OR description_lower LIKE '%sesame-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'sesame');
    END IF;
    
    -- Wheat free
    IF description_lower LIKE '%wheat free%' OR description_lower LIKE '%wheat-free%' THEN
        cleaned_allergens := array_remove(cleaned_allergens, 'wheat');
    END IF;
    
    RETURN cleaned_allergens;
END;
$$ LANGUAGE plpgsql;

-- Function to standardize entire allergen array
CREATE OR REPLACE FUNCTION standardize_allergen_array(allergens TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    standardized_allergens TEXT[];
    allergen TEXT;
    standardized_name TEXT;
BEGIN
    standardized_allergens := ARRAY[]::TEXT[];
    
    -- Process each allergen in the array
    FOREACH allergen IN ARRAY allergens
    LOOP
        -- Skip empty or null allergens
        IF allergen IS NULL OR allergen = '' THEN
            CONTINUE;
        END IF;
        
        -- Standardize the allergen name
        standardized_name := standardize_allergen_name(allergen);
        
        -- Add to array if it's a valid allergen
        IF standardized_name IS NOT NULL THEN
            standardized_allergens := array_append(standardized_allergens, standardized_name);
        END IF;
    END LOOP;
    
    -- Remove duplicates and return
    RETURN ARRAY(SELECT DISTINCT unnest(standardized_allergens) ORDER BY 1);
END;
$$ LANGUAGE plpgsql;

-- Function to validate allergen array
CREATE OR REPLACE FUNCTION validate_allergen_array(allergens TEXT[])
RETURNS TABLE(
    is_valid BOOLEAN,
    errors TEXT[],
    warnings TEXT[]
) AS $$
DECLARE
    allergen TEXT;
    error_messages TEXT[];
    warning_messages TEXT[];
    has_errors BOOLEAN := FALSE;
    has_warnings BOOLEAN := FALSE;
BEGIN
    error_messages := ARRAY[]::TEXT[];
    warning_messages := ARRAY[]::TEXT[];
    
    -- Check if array is null or empty
    IF allergens IS NULL OR array_length(allergens, 1) IS NULL THEN
        RETURN QUERY SELECT FALSE, ARRAY['Allergens array cannot be null or empty'], ARRAY[]::TEXT[];
        RETURN;
    END IF;
    
    -- Process each allergen
    FOREACH allergen IN ARRAY allergens
    LOOP
        -- Check for spaces
        IF allergen LIKE '% %' THEN
            error_messages := array_append(error_messages, 
                format('Allergen "%s" contains spaces. Use "treenuts" not "tree nuts"', allergen));
            has_errors := TRUE;
        END IF;
        
        -- Check for underscores
        IF allergen LIKE '%_%' THEN
            error_messages := array_append(error_messages, 
                format('Allergen "%s" contains underscores. Use "treenuts" not "tree_nuts"', allergen));
            has_errors := TRUE;
        END IF;
        
        -- Check for uppercase
        IF allergen != lower(allergen) THEN
            error_messages := array_append(error_messages, 
                format('Allergen "%s" contains uppercase. Use "%s" not "%s"', 
                    allergen, lower(allergen), allergen));
            has_errors := TRUE;
        END IF;
        
        -- Check if it's a valid allergen
        IF NOT is_valid_allergen(allergen) THEN
            error_messages := array_append(error_messages, 
                format('Allergen "%s" is not a recognized allergen', allergen));
            has_errors := TRUE;
        END IF;
        
        -- Check for potential contradictions (warnings)
        IF allergen IN ('gluten', 'wheat') AND 
           EXISTS (SELECT 1 FROM unnest(allergens) a WHERE a IN ('gluten', 'wheat') AND a != allergen) THEN
            warning_messages := array_append(warning_messages, 
                'Both "gluten" and "wheat" detected - consider using only "gluten"');
            has_warnings := TRUE;
        END IF;
    END LOOP;
    
    -- Check for duplicates
    IF array_length(allergens, 1) != array_length(array(
        SELECT DISTINCT unnest(allergens)
    ), 1) THEN
        error_messages := array_append(error_messages, 'Duplicate allergens found in array');
        has_errors := TRUE;
    END IF;
    
    RETURN QUERY SELECT 
        NOT has_errors,
        CASE WHEN has_errors THEN error_messages ELSE ARRAY[]::TEXT[] END,
        CASE WHEN has_warnings THEN warning_messages ELSE ARRAY[]::TEXT[] END;
END;
$$ LANGUAGE plpgsql;

-- Function to get allergen statistics
CREATE OR REPLACE FUNCTION get_allergen_statistics()
RETURNS TABLE(
    total_products BIGINT,
    products_with_allergens BIGINT,
    most_common_allergen TEXT,
    most_common_count BIGINT,
    average_allergens_per_product NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH allergen_stats AS (
        SELECT 
            COUNT(*) as total_products,
            COUNT(*) FILTER (WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0) as products_with_allergens,
            (SELECT allergen FROM (
                SELECT unnest(allergens) as allergen, COUNT(*) as cnt
                FROM "IngredientCategorized"
                WHERE allergens IS NOT NULL
                GROUP BY unnest(allergens)
                ORDER BY cnt DESC
                LIMIT 1
            ) t) as most_common_allergen,
            (SELECT cnt FROM (
                SELECT unnest(allergens) as allergen, COUNT(*) as cnt
                FROM "IngredientCategorized"
                WHERE allergens IS NOT NULL
                GROUP BY unnest(allergens)
                ORDER BY cnt DESC
                LIMIT 1
            ) t) as most_common_count,
            AVG(array_length(allergens, 1)) FILTER (WHERE allergens IS NOT NULL) as avg_allergens
        FROM "IngredientCategorized"
    )
    SELECT 
        total_products,
        products_with_allergens,
        most_common_allergen,
        most_common_count,
        ROUND(avg_allergens::NUMERIC, 2)
    FROM allergen_stats;
END;
$$ LANGUAGE plpgsql; 