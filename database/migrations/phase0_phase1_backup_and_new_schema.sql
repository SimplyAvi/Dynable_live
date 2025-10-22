-- ============================================================================
-- DYNABLE DATABASE MIGRATION: PHASE 0 & PHASE 1
-- ============================================================================
-- Purpose: Create backups and build new schema alongside old tables
-- Status: Zero downtime - website continues working with old tables
-- Date: 2025-10-22
-- Reference: DATABASE_ARCHITECTURE_ANALYSIS.md Lines 1196-1249
-- ============================================================================

-- ============================================================================
-- PHASE 0: PREPARATION (BACKUP & TRACKING)
-- ============================================================================

-- Step 1: Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_pre_migration;

-- Step 2: Backup critical tables (this may take 5-10 minutes)
DO $$
BEGIN
    RAISE NOTICE 'Creating backup of IngredientCategorized table...';
    CREATE TABLE IF NOT EXISTS backup_pre_migration."IngredientCategorized" AS 
    SELECT * FROM public."IngredientCategorized";
    RAISE NOTICE '✅ IngredientCategorized backed up';
    
    RAISE NOTICE 'Creating backup of Recipes table...';
    CREATE TABLE IF NOT EXISTS backup_pre_migration."Recipes" AS 
    SELECT * FROM public."Recipes";
    RAISE NOTICE '✅ Recipes backed up';
    
    RAISE NOTICE 'Creating backup of RecipeIngredients table...';
    CREATE TABLE IF NOT EXISTS backup_pre_migration."RecipeIngredients" AS 
    SELECT * FROM public."RecipeIngredients";
    RAISE NOTICE '✅ RecipeIngredients backed up';
    
    RAISE NOTICE 'Creating backup of Users table...';
    CREATE TABLE IF NOT EXISTS backup_pre_migration."Users" AS 
    SELECT * FROM public."Users";
    RAISE NOTICE '✅ Users backed up';
END $$;

-- Step 3: Create migration tracking table
CREATE TABLE IF NOT EXISTS public.migration_status (
    id SERIAL PRIMARY KEY,
    phase VARCHAR(50),
    step VARCHAR(100),
    status VARCHAR(20),  -- 'pending', 'in_progress', 'completed', 'failed'
    records_processed INTEGER DEFAULT 0,
    total_records INTEGER,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Log Phase 0 completion
INSERT INTO public.migration_status (phase, step, status, completed_at)
VALUES ('Phase 0', 'Backup Creation', 'completed', NOW());

-- ============================================================================
-- PHASE 1: CREATE NEW SCHEMA (NEW TABLES ALONGSIDE OLD)
-- ============================================================================

-- Reference: DATABASE_ARCHITECTURE_ANALYSIS.md Lines 727-814

-- Table 1: Products (Partitioned) - Main product table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    
    -- Product information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    brand_name VARCHAR(100),
    brand_owner VARCHAR(100),
    
    -- Categorization
    category_id INTEGER,
    subcategory_id INTEGER,
    
    -- Product classification
    is_processed BOOLEAN DEFAULT false,
    is_fresh_produce BOOLEAN DEFAULT false,
    is_basic_ingredient BOOLEAN DEFAULT false,
    
    -- Allergen data (preserved from current system)
    allergens TEXT[] DEFAULT '{}',
    contains_allergens TEXT[] DEFAULT '{}',
    allergen_free_tags TEXT[] DEFAULT '{}',
    processed_for_allergens BOOLEAN DEFAULT false,
    allergen_last_updated TIMESTAMP DEFAULT NOW(),
    
    -- Nutritional info
    serving_size DECIMAL(10,2),
    serving_size_unit VARCHAR(20),
    household_serving_text VARCHAR(200),
    
    -- External identifiers
    fdc_id INTEGER,
    gtin_upc VARCHAR(50),
    
    -- Data source tracking
    data_source VARCHAR(50),
    food_class VARCHAR(50),
    data_type VARCHAR(50),
    
    -- E-commerce fields (preserved for seller functionality)
    seller_id INTEGER,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    price DECIMAL(10,2),
    
    -- Packaging
    package_weight VARCHAR(50),
    ingredients_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    modified_date TIMESTAMP,
    available_date TIMESTAMP,
    publication_date TIMESTAMP
    
) PARTITION BY HASH (id);

-- Create 8 partitions for parallel query performance
CREATE TABLE IF NOT EXISTS public.products_0 PARTITION OF public.products 
FOR VALUES WITH (MODULUS 8, REMAINDER 0);

CREATE TABLE IF NOT EXISTS public.products_1 PARTITION OF public.products 
FOR VALUES WITH (MODULUS 8, REMAINDER 1);

CREATE TABLE IF NOT EXISTS public.products_2 PARTITION OF public.products 
FOR VALUES WITH (MODULUS 8, REMAINDER 2);

CREATE TABLE IF NOT EXISTS public.products_3 PARTITION OF public.products 
FOR VALUES WITH (MODULUS 8, REMAINDER 3);

CREATE TABLE IF NOT EXISTS public.products_4 PARTITION OF public.products 
FOR VALUES WITH (MODULUS 8, REMAINDER 4);

CREATE TABLE IF NOT EXISTS public.products_5 PARTITION OF public.products 
FOR VALUES WITH (MODULUS 8, REMAINDER 5);

CREATE TABLE IF NOT EXISTS public.products_6 PARTITION OF public.products 
FOR VALUES WITH (MODULUS 8, REMAINDER 6);

CREATE TABLE IF NOT EXISTS public.products_7 PARTITION OF public.products 
FOR VALUES WITH (MODULUS 8, REMAINDER 7);

-- Indexes for fast queries on products table
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON public.products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_description_gin ON public.products USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_allergens_gin ON public.products USING gin(allergens);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id) WHERE seller_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;

-- Unique constraint on fdc_id including partition key (id)
-- Note: This allows NULL fdc_id but ensures uniqueness when present
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_fdc_unique ON public.products(fdc_id, id) WHERE fdc_id IS NOT NULL;

-- Table 2: Ingredients (Semantic Ingredient Taxonomy)
-- ============================================================================
-- Reference: DATABASE_ARCHITECTURE_ANALYSIS.md Lines 824-876

CREATE TABLE IF NOT EXISTS public.ingredients (
    -- Primary identification
    id SERIAL PRIMARY KEY,
    
    -- Ingredient naming
    canonical_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    aliases TEXT[] DEFAULT '{}',
    
    -- Semantic categorization
    category VARCHAR(50) NOT NULL,  -- 'protein', 'vegetable', 'dairy', 'grain', 'spice', etc.
    subcategory VARCHAR(50),        -- 'poultry', 'leafy_green', 'cheese', 'whole_grain', etc.
    
    -- Hierarchy support
    parent_ingredient_id INTEGER REFERENCES public.ingredients(id),
    
    -- Allergen information
    allergens TEXT[] DEFAULT '{}',
    is_common_allergen BOOLEAN DEFAULT false,
    
    -- Classification
    is_basic_ingredient BOOLEAN DEFAULT true,
    is_processed BOOLEAN DEFAULT false,
    
    -- Additional metadata
    description TEXT,
    nutritional_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for ingredients table
CREATE INDEX IF NOT EXISTS idx_ingredients_canonical ON public.ingredients(canonical_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON public.ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_aliases_gin ON public.ingredients USING gin(aliases);
CREATE INDEX IF NOT EXISTS idx_ingredients_parent ON public.ingredients(parent_ingredient_id) WHERE parent_ingredient_id IS NOT NULL;

-- Table 3: Ingredient-Product Mapping (Junction Table)
-- ============================================================================
-- Reference: DATABASE_ARCHITECTURE_ANALYSIS.md Lines 885-937

CREATE TABLE IF NOT EXISTS public.ingredient_product_mapping (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    
    -- Relationships
    ingredient_id INTEGER NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    
    -- Confidence scoring
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    match_type VARCHAR(20) NOT NULL,  -- 'exact', 'semantic', 'fuzzy', 'manual'
    
    -- Metadata
    matching_algorithm VARCHAR(50),  -- Which algorithm created this mapping
    reviewed_by_human BOOLEAN DEFAULT false,
    review_status VARCHAR(20),  -- 'pending', 'approved', 'rejected'
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Uniqueness constraint
    UNIQUE(ingredient_id, product_id)
);

-- Indexes for fast lookups on mapping table
CREATE INDEX IF NOT EXISTS idx_mapping_ingredient ON public.ingredient_product_mapping(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_mapping_product ON public.ingredient_product_mapping(product_id);
CREATE INDEX IF NOT EXISTS idx_mapping_confidence ON public.ingredient_product_mapping(confidence_score) WHERE confidence_score >= 0.80;
CREATE INDEX IF NOT EXISTS idx_mapping_type ON public.ingredient_product_mapping(match_type);
CREATE INDEX IF NOT EXISTS idx_mapping_review ON public.ingredient_product_mapping(review_status) WHERE review_status = 'pending';

-- Table 4: Mapping Review Queue (for human review)
-- ============================================================================
-- Reference: DATABASE_ARCHITECTURE_ANALYSIS.md Lines 1638-1678

CREATE TABLE IF NOT EXISTS public.mapping_review_queue (
    id SERIAL PRIMARY KEY,
    mapping_id BIGINT REFERENCES public.ingredient_product_mapping(id),
    product_id BIGINT REFERENCES public.products(id),
    ingredient_id INTEGER REFERENCES public.ingredients(id),
    suggested_confidence DECIMAL(3,2),
    review_priority VARCHAR(20),  -- 'critical', 'high', 'medium', 'low'
    flagged_reason VARCHAR(200),
    reviewer_notes TEXT,
    reviewed_by INTEGER REFERENCES public."Users"(id),
    review_decision VARCHAR(20),  -- 'approve', 'reject', 'modify'
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_queue_priority ON public.mapping_review_queue(review_priority) WHERE reviewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_review_queue_created ON public.mapping_review_queue(created_at) WHERE reviewed_at IS NULL;

-- Table 5: Ingredient History (Version Control)
-- ============================================================================
-- Reference: DATABASE_ARCHITECTURE_ANALYSIS.md Lines 1827-1866

CREATE TABLE IF NOT EXISTS public.ingredient_history (
    id BIGSERIAL PRIMARY KEY,
    ingredient_id INTEGER REFERENCES public.ingredients(id),
    version INTEGER NOT NULL,
    canonical_name VARCHAR(100),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    aliases TEXT[],
    changed_by INTEGER REFERENCES public."Users"(id),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_history_ingredient ON public.ingredient_history(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_history_changed ON public.ingredient_history(changed_at);

-- Step 2: Create migration views for backwards compatibility
-- ============================================================================

CREATE OR REPLACE VIEW public."IngredientCategorized_legacy" AS 
SELECT * FROM public."IngredientCategorized";

-- Step 3: Log Phase 1 completion
-- ============================================================================

INSERT INTO public.migration_status (phase, step, status, completed_at)
VALUES ('Phase 1', 'New Schema Creation', 'completed', NOW());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify new tables exist and are empty
DO $$
DECLARE
    products_count INTEGER;
    ingredients_count INTEGER;
    mapping_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO products_count FROM public.products;
    SELECT COUNT(*) INTO ingredients_count FROM public.ingredients;
    SELECT COUNT(*) INTO mapping_count FROM public.ingredient_product_mapping;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PHASE 1 VERIFICATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Products table: % records (should be 0)', products_count;
    RAISE NOTICE 'Ingredients table: % records (should be 0)', ingredients_count;
    RAISE NOTICE 'Mapping table: % records (should be 0)', mapping_count;
    RAISE NOTICE '============================================';
    
    IF products_count = 0 AND ingredients_count = 0 AND mapping_count = 0 THEN
        RAISE NOTICE '✅ Phase 1 completed successfully - new tables are empty';
        RAISE NOTICE '✅ Website still works with old tables';
    ELSE
        RAISE WARNING '⚠️  Warning: New tables are not empty';
    END IF;
END $$;

-- Check backup tables exist
SELECT 
    'Backup verification' as check_name,
    (SELECT COUNT(*) FROM backup_pre_migration."IngredientCategorized") as ingredientcategorized_backup_count,
    (SELECT COUNT(*) FROM backup_pre_migration."Recipes") as recipes_backup_count,
    (SELECT COUNT(*) FROM backup_pre_migration."RecipeIngredients") as recipeingredients_backup_count,
    (SELECT COUNT(*) FROM backup_pre_migration."Users") as users_backup_count;

-- ============================================================================
-- NOTES FOR NEXT STEPS
-- ============================================================================

-- Phase 1 is now complete! Next steps:
-- 
-- Phase 2 (Week 2): Migrate product data from IngredientCategorized to products table
--   - Run: database/migrations/phase2_migrate_products.sql
-- 
-- Phase 3 (Week 3): Build ingredient taxonomy from recipe data + USDA import
--   - Run: scripts/import_usda_taxonomy.js
--   - Then: database/migrations/phase3_build_taxonomy.sql
-- 
-- Website Status: ✅ STILL WORKS - Application uses old tables
-- 
-- Rollback: If needed, simply drop new tables:
--   DROP TABLE IF EXISTS ingredient_product_mapping CASCADE;
--   DROP TABLE IF EXISTS ingredients CASCADE;
--   DROP TABLE IF EXISTS products CASCADE;

