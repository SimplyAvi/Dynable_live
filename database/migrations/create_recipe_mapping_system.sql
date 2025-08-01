-- Recipe-to-Product Mapping System Database Schema
-- Author: Justin Linzan
-- Date: January 2025
-- 
-- This migration creates a comprehensive two-phase mapping system to solve
-- database timeout issues in recipe-to-product workflows.
-- 
-- Phase 1: ProductCanonical - Clean product names and pre-computed mappings
-- Phase 2: IngredientCanonical - Clean ingredient names and pre-computed product matches
-- Phase 3: SubstituteMapping - Enhanced allergen-safe substitute system

-- =============================================================================
-- PHASE 1: PRODUCT CANONICAL MAPPING
-- =============================================================================

-- Create ProductCanonical table for clean product mappings
CREATE TABLE IF NOT EXISTS "ProductCanonical" (
    id SERIAL PRIMARY KEY,
    original_product_name TEXT NOT NULL,      -- "zero sugar coca cola"
    canonical_product_name TEXT NOT NULL,     -- "cola"
    product_category TEXT,                    -- "beverage"
    base_ingredients TEXT[],                  -- ["cola nut", "caffeine", "sweetener"]
    allergens TEXT[],                         -- ["artificialSweeteners"] (camelCase)
    descriptors TEXT[],                       -- ["zero_sugar", "diet", "caffeine_free"]
    product_ids INTEGER[],                    -- All product IDs that match this canonical
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_canonical_name ON "ProductCanonical" (canonical_product_name);
CREATE INDEX IF NOT EXISTS idx_product_canonical_original ON "ProductCanonical" (original_product_name);
CREATE INDEX IF NOT EXISTS idx_product_canonical_ids ON "ProductCanonical" USING GIN (product_ids);
CREATE INDEX IF NOT EXISTS idx_product_canonical_category ON "ProductCanonical" (product_category);

-- =============================================================================
-- PHASE 2: INGREDIENT CANONICAL MAPPING
-- =============================================================================

-- Create IngredientCanonical table for clean ingredient mappings
CREATE TABLE IF NOT EXISTS "IngredientCanonical" (
    id SERIAL PRIMARY KEY,
    original_ingredient TEXT NOT NULL,        -- "2 cups diced tomatoes"
    canonical_ingredient TEXT NOT NULL,       -- "tomatoes"
    ingredient_category TEXT,                 -- "vegetable"
    preparation_method TEXT,                  -- "diced"
    quantity_measurement TEXT,                -- "2 cups"
    matching_products INTEGER[],              -- Pre-computed product IDs
    substitute_ingredients TEXT[],            -- ["bell peppers", "sun dried tomatoes"]
    substitute_product_ids INTEGER[],         -- Pre-computed substitute product IDs
    allergen_considerations TEXT[],           -- Allergen info for substitutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_name ON "IngredientCanonical" (canonical_ingredient);
CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_original ON "IngredientCanonical" (original_ingredient);
CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_products ON "IngredientCanonical" USING GIN (matching_products);
CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_substitutes ON "IngredientCanonical" USING GIN (substitute_product_ids);
CREATE INDEX IF NOT EXISTS idx_ingredient_canonical_category ON "IngredientCanonical" (ingredient_category);

-- =============================================================================
-- PHASE 3: ENHANCED SUBSTITUTE MAPPING SYSTEM
-- =============================================================================

-- Drop existing SubstituteMappings table and recreate with enhanced structure
DROP TABLE IF EXISTS "SubstituteMappings";

CREATE TABLE "SubstituteMappings" (
    id SERIAL PRIMARY KEY,
    original_product_canonical TEXT NOT NULL,  -- "flour"
    original_allergens TEXT[],                 -- ["wheat", "gluten"]
    substitute_product_canonical TEXT NOT NULL, -- "almond_flour"
    substitute_allergens TEXT[],               -- ["treeNuts"]
    substitute_ratio TEXT,                     -- "1:1" or "3/4 cup per 1 cup"
    cooking_notes TEXT,                        -- "May affect texture"
    dietary_categories TEXT[],                 -- ["glutenFree", "keto", "paleo"]
    confidence_score DECIMAL(3,2),             -- 0.95 for high confidence
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_substitute_original ON "SubstituteMappings" (original_product_canonical);
CREATE INDEX IF NOT EXISTS idx_substitute_substitute ON "SubstituteMappings" (substitute_product_canonical);
CREATE INDEX IF NOT EXISTS idx_substitute_confidence ON "SubstituteMappings" (confidence_score);
CREATE INDEX IF NOT EXISTS idx_substitute_allergens ON "SubstituteMappings" USING GIN (original_allergens);
CREATE INDEX IF NOT EXISTS idx_substitute_substitute_allergens ON "SubstituteMappings" USING GIN (substitute_allergens);

-- =============================================================================
-- HELPER FUNCTIONS FOR CANONICAL MAPPING
-- =============================================================================

-- Function to clean product names by removing descriptors
CREATE OR REPLACE FUNCTION clean_product_name(product_name TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned_name TEXT;
    descriptors TEXT[] := ARRAY[
        'zero sugar', 'diet', 'light', 'reduced fat', 'low fat', 'fat free',
        'all purpose', 'whole wheat', 'organic', 'natural', 'extra virgin',
        'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked',
        'original', 'classic', 'traditional', 'premium', 'select',
        'reduced sodium', 'low sodium', 'no salt added', 'unsalted',
        'sugar free', 'no sugar added', 'artificially sweetened',
        'whole grain', 'multigrain', 'enriched', 'bleached', 'unbleached'
    ];
    descriptor TEXT;
BEGIN
    cleaned_name := lower(product_name);
    
    -- Remove descriptors
    FOREACH descriptor IN ARRAY descriptors
    LOOP
        cleaned_name := regexp_replace(cleaned_name, '\y' || descriptor || '\y', '', 'gi');
    END LOOP;
    
    -- Remove common brand names
    cleaned_name := regexp_replace(cleaned_name, '\y(coca cola|pepsi|kraft|heinz|campbell|nestle|kellogg|general mills)\y', '', 'gi');
    
    -- Remove measurements and quantities
    cleaned_name := regexp_replace(cleaned_name, '\d+[\/\d]*\s*(cups?|tbsp|tsp|oz|lbs?|grams?|kg|ml|liters?|packages?|cans?|containers?|envelopes?|slices?|loaves?|sticks?|cloves?|heads?|bunches?|sprigs?|pieces?|sheets?|bags?|bottles?|jars?|boxes?|packets?|drops?|ears?|stalks?|strips?|cubes?|blocks?|bars?)\b', '', 'gi');
    
    -- Clean up extra spaces and punctuation
    cleaned_name := regexp_replace(cleaned_name, '\s+', ' ', 'g');
    cleaned_name := regexp_replace(cleaned_name, '^[,\s]+|[,\s]+$', '', 'g');
    cleaned_name := trim(cleaned_name);
    
    RETURN cleaned_name;
END;
$$ LANGUAGE plpgsql;

-- Function to clean ingredient names by removing action words and measurements
CREATE OR REPLACE FUNCTION clean_ingredient_name(ingredient_name TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned_name TEXT;
    action_words TEXT[] := ARRAY[
        'diced', 'chopped', 'minced', 'sliced', 'grated', 'shredded',
        'sautéed', 'roasted', 'grilled', 'baked', 'fried', 'steamed',
        'fresh', 'frozen', 'canned', 'dried', 'cooked', 'raw',
        'peeled', 'seeded', 'halved', 'quartered', 'zested', 'mashed',
        'crushed', 'cubed', 'julienned', 'optional', 'with juice',
        'with syrup', 'with liquid', 'in juice', 'in syrup', 'in liquid',
        'powdered', 'sweetened', 'unsweetened', 'softened', 'melted',
        'room temperature', 'cold', 'warm', 'hot', 'refrigerated',
        'thawed', 'defrosted', 'prepared', 'beaten', 'whipped',
        'stiff', 'soft', 'firm', 'fine', 'coarse', 'crumbled',
        'broken', 'pieces', 'chunks', 'strips', 'sticks', 'spears',
        'tips', 'ends', 'whole', 'large', 'small', 'medium',
        'extra large', 'extra small', 'thin', 'thick', 'lean',
        'fatty', 'boneless', 'skinless', 'bone-in', 'with skin',
        'without skin', 'with bone', 'without bone', 'center cut',
        'end cut', 'trimmed', 'untrimmed', 'pitted', 'unpitted',
        'seedless', 'with seeds', 'without seeds', 'cored', 'uncored',
        'stemmed', 'destemmed', 'deveined', 'unveined', 'cleaned',
        'uncleaned', 'split', 'unsplit', 'shelled', 'unshelled',
        'hulled', 'unhulled'
    ];
    action_word TEXT;
BEGIN
    cleaned_name := lower(ingredient_name);
    
    -- Remove action words
    FOREACH action_word IN ARRAY action_words
    LOOP
        cleaned_name := regexp_replace(cleaned_name, '\y' || action_word || '\y', '', 'gi');
    END LOOP;
    
    -- Remove measurements and quantities
    cleaned_name := regexp_replace(cleaned_name, '\d+[\/\d]*\s*(cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lb|grams?|kilograms?|kg|liters?|l|milliliters?|ml|packages?|cans?|containers?|envelopes?|slices?|loaves?|pinches?|dashes?|quarts?|qt|pints?|pt|gallons?|gal|sticks?|cloves?|heads?|bunches?|sprigs?|pieces?|sheets?|bags?|bottles?|jars?|boxes?|packets?|drops?|ears?|stalks?|strips?|cubes?|blocks?|bars?)\b', '', 'gi');
    
    -- Remove color descriptors
    cleaned_name := regexp_replace(cleaned_name, '\y(yellow|white|black|red|green|orange|purple|brown|golden|pink|blue|rainbow)\y', '', 'gi');
    
    -- Remove parentheticals
    cleaned_name := regexp_replace(cleaned_name, '\([^)]*\)', '', 'g');
    
    -- Remove optional text
    cleaned_name := regexp_replace(cleaned_name, 'optional|such as.*?\(.*?\)', '', 'gi');
    
    -- Clean up extra spaces and punctuation
    cleaned_name := regexp_replace(cleaned_name, '\s+', ' ', 'g');
    cleaned_name := regexp_replace(cleaned_name, '^[,\s]+|[,\s]+$', '', 'g');
    cleaned_name := trim(cleaned_name);
    
    RETURN cleaned_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS POLICIES FOR SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE "ProductCanonical" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IngredientCanonical" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubstituteMappings" ENABLE ROW LEVEL SECURITY;

-- ProductCanonical policies
CREATE POLICY "product_canonical_read_all" ON "ProductCanonical"
    FOR SELECT USING (true);

CREATE POLICY "product_canonical_admin_write" ON "ProductCanonical"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- IngredientCanonical policies
CREATE POLICY "ingredient_canonical_read_all" ON "IngredientCanonical"
    FOR SELECT USING (true);

CREATE POLICY "ingredient_canonical_admin_write" ON "IngredientCanonical"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- SubstituteMappings policies
CREATE POLICY "substitute_mappings_read_all" ON "SubstituteMappings"
    FOR SELECT USING (true);

CREATE POLICY "substitute_mappings_admin_write" ON "SubstituteMappings"
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER trigger_update_product_canonical_updated_at
    BEFORE UPDATE ON "ProductCanonical"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_ingredient_canonical_updated_at
    BEFORE UPDATE ON "IngredientCanonical"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_substitute_mappings_updated_at
    BEFORE UPDATE ON "SubstituteMappings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify table creation
SELECT 'ProductCanonical table created successfully' as status;
SELECT 'IngredientCanonical table created successfully' as status;
SELECT 'SubstituteMappings table enhanced successfully' as status;

-- Show table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('ProductCanonical', 'IngredientCanonical', 'SubstituteMappings')
ORDER BY table_name, ordinal_position;

-- Show indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('productcanonical', 'ingredientcanonical', 'substitutemappings')
ORDER BY tablename, indexname; 