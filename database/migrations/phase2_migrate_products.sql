-- ============================================================================
-- DYNABLE DATABASE MIGRATION: PHASE 2
-- ============================================================================
-- Purpose: Migrate 243,114 products from IngredientCategorized to products table
-- Status: Zero downtime - website continues working with old tables
-- Date: 2025-10-22
-- Reference: DATABASE_ARCHITECTURE_ANALYSIS.md Lines 1252-1318
-- Reference: PHASE2_COLUMN_MAPPING_ANALYSIS.md (Column mapping details)
-- ============================================================================

-- ============================================================================
-- PHASE 2: MIGRATE PRODUCTS DATA
-- ============================================================================

-- Log Phase 2 start
INSERT INTO public.migration_status (phase, step, status, started_at)
VALUES ('Phase 2', 'Product Migration', 'in_progress', NOW());

-- Migration with corrected column mappings
DO $$
DECLARE
    batch_size INT := 10000;
    offset_val INT := 0;
    total_count INT;
    processed_count INT := 0;
    batch_number INT := 0;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count FROM "IngredientCategorized";
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PHASE 2: PRODUCT MIGRATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total products to migrate: %', total_count;
    RAISE NOTICE 'Batch size: %', batch_size;
    RAISE NOTICE 'Estimated batches: %', CEIL(total_count::NUMERIC / batch_size);
    RAISE NOTICE 'Estimated time: % minutes', CEIL(total_count::NUMERIC / batch_size) * 0.1;
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Process in batches
    WHILE offset_val < total_count LOOP
        batch_number := batch_number + 1;
        
        -- Insert batch into new products table
        INSERT INTO products (
            -- Identity
            id,
            
            -- Product names
            name,
            description,
            short_description,
            
            -- Brand info
            brand_name,
            brand_owner,
            
            -- Categorization (CORRECTED: proper category lookup)
            subcategory_id,
            category_id,
            
            -- Classification (CORRECTED: uses Subcategories flags)
            is_processed,
            is_fresh_produce,
            is_basic_ingredient,
            
            -- Allergen data
            allergens,
            contains_allergens,
            allergen_free_tags,
            processed_for_allergens,
            allergen_last_updated,
            
            -- Nutritional info
            serving_size,
            serving_size_unit,
            household_serving_text,
            
            -- External identifiers
            fdc_id,
            gtin_upc,
            
            -- Data source
            data_source,
            food_class,
            data_type,
            
            -- E-commerce
            seller_id,
            stock_quantity,
            is_active,
            price,
            
            -- Packaging
            package_weight,
            ingredients_text,
            
            -- Timestamps
            created_at,
            updated_at,
            modified_date,
            available_date,
            publication_date
        )
        SELECT 
            -- Identity
            ic.id,
            
            -- Product names (CORRECTED: no duplication, truncate to fit)
            LEFT(ic.description, 255) as name,  -- Truncate to 255 chars max
            NULL as description,  -- Leave NULL for now, can populate later
            LEFT(ic."shortDescription", 500) as short_description,  -- Truncate to 500 chars max
            
            -- Brand info
            LEFT(ic."brandName", 100) as brand_name,  -- Truncate to 100 chars max
            LEFT(ic."brandOwner", 100) as brand_owner,  -- Truncate to 100 chars max
            
            -- Categorization (CORRECTED: proper lookup)
            ic."SubcategoryID" as subcategory_id,
            s."CategoryID" as category_id,  -- Look up parent category via JOIN
            
            -- Classification (CORRECTED: uses actual flags from Subcategories)
            COALESCE(s.is_processed_food, false) as is_processed,
            COALESCE(s.is_fresh_produce, false) as is_fresh_produce,
            COALESCE(s.is_basic_ingredient, false) as is_basic_ingredient,
            
            -- Allergen data
            ic.allergens,
            ic.contains_allergens,
            ic.allergen_free_tags,
            ic.processed_for_allergens,
            ic.allergen_last_updated::timestamp,
            
            -- Nutritional info
            ic."servingSize" as serving_size,
            LEFT(ic."servingSizeUnit", 20) as serving_size_unit,  -- Truncate to 20 chars max
            LEFT(ic."householdServingFullText", 200) as household_serving_text,  -- Truncate to 200 chars max
            
            -- External identifiers
            ic."fdcId" as fdc_id,
            LEFT(ic."gtinUpc", 50) as gtin_upc,  -- Truncate to 50 chars max
            
            -- Data source
            LEFT(ic."dataSource", 50) as data_source,  -- Truncate to 50 chars max
            LEFT(ic."foodClass", 50) as food_class,  -- Truncate to 50 chars max
            LEFT(ic."dataType", 50) as data_type,  -- Truncate to 50 chars max
            
            -- E-commerce
            ic.seller_id,
            ic.stock_quantity,
            ic.is_active,
            NULL as price,  -- Not in old table, default to NULL
            
            -- Packaging
            LEFT(ic."packageWeight", 50) as package_weight,  -- Truncate to 50 chars max
            ic.ingredients as ingredients_text,  -- TEXT type, no truncation needed
            
            -- Timestamps (cast to proper type)
            ic."createdAt"::timestamp as created_at,
            ic."updatedAt"::timestamp as updated_at,
            ic."modifiedDate"::timestamp as modified_date,
            ic."availableDate"::timestamp as available_date,
            ic."publicationDate"::timestamp as publication_date
            
        FROM "IngredientCategorized" ic
        LEFT JOIN "Subcategories" s ON ic."SubcategoryID" = s."SubcategoryID"
        ORDER BY ic.id
        LIMIT batch_size OFFSET offset_val
        ON CONFLICT (id) DO NOTHING;
        
        -- Get number of rows inserted
        GET DIAGNOSTICS processed_count = ROW_COUNT;
        offset_val := offset_val + batch_size;
        
        -- Update migration status
        UPDATE migration_status 
        SET records_processed = offset_val,
            total_records = total_count,
            updated_at = NOW()
        WHERE id = (
            SELECT id FROM migration_status
            WHERE phase = 'Phase 2' 
              AND step = 'Product Migration' 
              AND status = 'in_progress'
            ORDER BY started_at DESC 
            LIMIT 1
        );
        
        -- Log progress
        RAISE NOTICE 'Batch %: Migrated % products (% / % total, % percent complete)', 
                     batch_number,
                     processed_count, 
                     LEAST(offset_val, total_count),
                     total_count,
                     ROUND((LEAST(offset_val, total_count)::NUMERIC / total_count * 100)::NUMERIC, 1);
        
        -- Small delay to prevent overwhelming database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    -- Mark as completed
    UPDATE migration_status 
    SET status = 'completed', 
        completed_at = NOW(),
        records_processed = total_count,
        total_records = total_count
    WHERE id = (
        SELECT id FROM migration_status
        WHERE phase = 'Phase 2' 
          AND step = 'Product Migration'
        ORDER BY started_at DESC 
        LIMIT 1
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ PHASE 2 COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Total products migrated: %', total_count;
    RAISE NOTICE 'Total batches processed: %', batch_number;
    RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify migration count
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
    match BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO old_count FROM "IngredientCategorized";
    SELECT COUNT(*) INTO new_count FROM products;
    match := (old_count = new_count);
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Old table (IngredientCategorized): % records', old_count;
    RAISE NOTICE 'New table (products): % records', new_count;
    
    IF match THEN
        RAISE NOTICE '✅ PASS: Record counts match!';
    ELSE
        RAISE WARNING '❌ FAIL: Record counts DO NOT match!';
        RAISE WARNING 'Difference: % records', ABS(old_count - new_count);
    END IF;
    
    RAISE NOTICE '============================================';
END $$;

-- Check data quality
SELECT 
    'Data Quality Check' as check_name,
    COUNT(*) as total_products,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as has_name,
    COUNT(CASE WHEN brand_name IS NOT NULL THEN 1 END) as has_brand,
    COUNT(CASE WHEN allergens IS NOT NULL AND array_length(allergens, 1) > 0 THEN 1 END) as has_allergens,
    COUNT(CASE WHEN subcategory_id IS NOT NULL THEN 1 END) as has_subcategory,
    COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as has_category
FROM products;

-- Check categorization mapping
SELECT 
    'Category Mapping' as check_name,
    COUNT(DISTINCT category_id) as unique_categories,
    COUNT(DISTINCT subcategory_id) as unique_subcategories,
    COUNT(CASE WHEN is_processed = true THEN 1 END) as processed_products,
    COUNT(CASE WHEN is_fresh_produce = true THEN 1 END) as fresh_produce_products,
    COUNT(CASE WHEN is_basic_ingredient = true THEN 1 END) as basic_ingredients
FROM products;

-- Sample check: Show first 5 migrated products
SELECT 
    id,
    name,
    brand_name,
    category_id,
    subcategory_id,
    is_processed,
    is_fresh_produce,
    array_length(allergens, 1) as allergen_count,
    created_at
FROM products
ORDER BY id
LIMIT 5;

-- ============================================================================
-- NOTES FOR NEXT STEPS
-- ============================================================================

-- Phase 2 is now complete! Next steps:
-- 
-- Phase 3 (Week 3): Build ingredient taxonomy
--   - Run: scripts/import_usda_taxonomy.js (optional - uses USDA as base)
--   - Then: database/migrations/phase3_build_taxonomy.sql
-- 
-- Website Status: ✅ STILL WORKS - Application uses old IngredientCategorized table
-- 
-- Rollback: If needed:
--   TRUNCATE TABLE products CASCADE;
--   -- Then re-run this migration

