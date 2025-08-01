-- Simple Recipe-to-Product Mapping Tables
-- Focus: Performance and camelCase consistency
-- Author: Justin Linzan
-- Date: January 2025

-- Phase 1: Product Canonical Mapping
CREATE TABLE IF NOT EXISTS "ProductCanonical" (
    id SERIAL PRIMARY KEY,
    original_product_name TEXT NOT NULL,      -- "zero sugar coca cola"
    canonical_product_name TEXT NOT NULL UNIQUE,     -- "cola" (camelCase if multi-word)
    product_ids INTEGER[],                    -- [123, 456, 789] for fast lookups
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase 2: Ingredient Canonical Mapping  
CREATE TABLE IF NOT EXISTS "IngredientCanonical" (
    id SERIAL PRIMARY KEY,
    original_ingredient TEXT NOT NULL,        -- "2 cups diced tomatoes"
    canonical_ingredient TEXT NOT NULL UNIQUE,       -- "tomatoes" (camelCase if multi-word)
    matching_products INTEGER[],              -- Pre-computed product IDs from Phase 1
    substitute_product_ids INTEGER[],         -- Alternative products for allergens
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_canonical_name ON "ProductCanonical" (canonical_product_name);
CREATE INDEX IF NOT EXISTS idx_product_canonical_original ON "ProductCanonical" (original_product_name);
CREATE INDEX IF NOT EXISTS idx_product_canonical_ids ON "ProductCanonical" USING GIN (product_ids);

CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_name ON "IngredientCanonical" (canonical_ingredient);
CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_original ON "IngredientCanonical" (original_ingredient);
CREATE INDEX IF NOT EXISTS idx_ingredient_matching_products ON "IngredientCanonical" USING GIN (matching_products);
CREATE INDEX IF NOT EXISTS idx_ingredient_substitute_products ON "IngredientCanonical" USING GIN (substitute_product_ids);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_canonical_updated_at 
    BEFORE UPDATE ON "ProductCanonical" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredient_canonical_updated_at 
    BEFORE UPDATE ON "IngredientCanonical" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function for camelCase conversion
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

-- Helper function to clean product names
CREATE OR REPLACE FUNCTION clean_product_name(product_name TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned_name TEXT;
    descriptors TEXT[] := ARRAY[
        'zero sugar', 'diet', 'light', 'reduced fat', 'low fat', 'fat free',
        'all purpose', 'whole wheat', 'organic', 'natural', 'extra virgin',
        'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked', 'premium',
        'select', 'choice', 'grade a', 'grade b', 'no sugar added',
        'sugar free', 'unsweetened', 'original', 'classic', 'traditional'
    ];
    descriptor TEXT;
BEGIN
    cleaned_name := lower(product_name);
    
    -- Remove descriptors
    FOREACH descriptor IN ARRAY descriptors LOOP
        cleaned_name := regexp_replace(cleaned_name, '\y' || descriptor || '\y', '', 'gi');
    END LOOP;
    
    -- Clean up extra spaces
    cleaned_name := regexp_replace(cleaned_name, '\s+', ' ', 'g');
    cleaned_name := trim(cleaned_name);
    
    -- Convert to camelCase if multi-word
    IF cleaned_name ~ '\s' THEN
        cleaned_name := to_camel_case(cleaned_name);
    END IF;
    
    RETURN cleaned_name;
END;
$$ LANGUAGE plpgsql;

-- Helper function to clean ingredient names
CREATE OR REPLACE FUNCTION clean_ingredient_name(ingredient_name TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned_name TEXT;
    action_words TEXT[] := ARRAY[
        'diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded',
        'sautéed', 'roasted', 'grilled', 'baked', 'fried', 'steamed',
        'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw', 'peeled',
        'seeded', 'stemmed', 'trimmed', 'cleaned', 'washed', 'drained'
    ];
    measurements TEXT[] := ARRAY[
        '\d+\s*(cups?|tbsp|tsp|oz|lbs?|grams?|kg|ml|liters?)',
        '\d+\/\d+', -- fractions
        '\ba\s+few\b',
        '\ba\s+pinch\b',
        '\bone\b',
        '\btwo\b',
        '\bthree\b',
        '\bfour\b',
        '\bfive\b'
    ];
    action_word TEXT;
    measurement TEXT;
BEGIN
    cleaned_name := lower(ingredient_name);
    
    -- Remove action words
    FOREACH action_word IN ARRAY action_words LOOP
        cleaned_name := regexp_replace(cleaned_name, '\y' || action_word || '\y', '', 'gi');
    END LOOP;
    
    -- Remove measurements
    FOREACH measurement IN ARRAY measurements LOOP
        cleaned_name := regexp_replace(cleaned_name, measurement, '', 'gi');
    END LOOP;
    
    -- Clean up extra spaces
    cleaned_name := regexp_replace(cleaned_name, '\s+', ' ', 'g');
    cleaned_name := trim(cleaned_name);
    
    -- Convert to camelCase if multi-word
    IF cleaned_name ~ '\s' THEN
        cleaned_name := to_camel_case(cleaned_name);
    END IF;
    
    RETURN cleaned_name;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (if needed)
ALTER TABLE "ProductCanonical" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IngredientCanonical" ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust as needed)
CREATE POLICY "Allow all operations on ProductCanonical" ON "ProductCanonical" FOR ALL USING (true);
CREATE POLICY "Allow all operations on IngredientCanonical" ON "IngredientCanonical" FOR ALL USING (true);

-- Insert some test data to verify functions
INSERT INTO "ProductCanonical" (original_product_name, canonical_product_name, product_ids) VALUES
('zero sugar coca cola', 'cola', ARRAY[1, 2, 3]),
('all purpose flour', 'flour', ARRAY[4, 5, 6]),
('extra virgin olive oil', 'extraVirginOliveOil', ARRAY[7, 8, 9])
ON CONFLICT DO NOTHING;

INSERT INTO "IngredientCanonical" (original_ingredient, canonical_ingredient, matching_products, substitute_product_ids) VALUES
('2 cups diced tomatoes', 'tomatoes', ARRAY[1, 2, 3], ARRAY[4, 5, 6]),
('chopped onions', 'onions', ARRAY[7, 8, 9], ARRAY[10, 11, 12]),
('minced garlic', 'garlic', ARRAY[13, 14, 15], ARRAY[16, 17, 18])
ON CONFLICT DO NOTHING;

-- Verify the functions work correctly
SELECT 
    'Product cleaning test' as test_type,
    original_product_name,
    canonical_product_name,
    clean_product_name(original_product_name) as cleaned_result
FROM "ProductCanonical";

SELECT 
    'Ingredient cleaning test' as test_type,
    original_ingredient,
    canonical_ingredient,
    clean_ingredient_name(original_ingredient) as cleaned_result
FROM "IngredientCanonical"; 