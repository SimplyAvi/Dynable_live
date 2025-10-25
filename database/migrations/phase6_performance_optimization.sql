-- =====================================================
-- PHASE 6: PERFORMANCE OPTIMIZATION
-- =====================================================
-- This script creates materialized views and optimizations
-- for the semantic matching system

-- Step 1: Create materialized view for ingredient-product statistics
-- This pre-computes common queries for better performance
CREATE MATERIALIZED VIEW ingredient_product_stats AS
SELECT 
    i.id,
    i.canonical_name,
    i.category,
    i.subcategory,
    COUNT(DISTINCT ipm.product_id) as product_count,
    AVG(ipm.confidence_score) as avg_confidence,
    COUNT(DISTINCT CASE WHEN ipm.confidence_score >= 0.90 THEN ipm.product_id END) as high_confidence_count,
    COUNT(DISTINCT CASE WHEN ipm.confidence_score < 0.75 THEN ipm.product_id END) as needs_review_count,
    MAX(ipm.created_at) as last_mapping_update,
    -- Allergen statistics
    COUNT(DISTINCT CASE WHEN p.allergens IS NOT NULL AND array_length(p.allergens, 1) > 0 THEN p.id END) as products_with_allergens,
    COUNT(DISTINCT CASE WHEN p.allergens IS NOT NULL AND array_length(p.allergens, 1) = 0 THEN p.id END) as allergen_free_products
FROM ingredients i
LEFT JOIN ingredient_product_mapping ipm ON i.id = ipm.ingredient_id
LEFT JOIN products p ON ipm.product_id = p.id
GROUP BY i.id, i.canonical_name, i.category, i.subcategory;

-- Create unique index to enable CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_ingredient_stats_id ON ingredient_product_stats(id);

-- Create additional indexes for fast queries
CREATE INDEX idx_ingredient_stats_category ON ingredient_product_stats(category);
CREATE INDEX idx_ingredient_stats_product_count ON ingredient_product_stats(product_count);
CREATE INDEX idx_ingredient_stats_confidence ON ingredient_product_stats(avg_confidence);

-- Step 2: Create materialized view for product-allergen statistics
-- This helps with allergen filtering performance
CREATE MATERIALIZED VIEW product_allergen_stats AS
SELECT 
    p.id,
    p.name,
    p.brand_name,
    p.category_id,
    p.subcategory_id,
    p.allergens,
    array_length(p.allergens, 1) as allergen_count,
    -- Count of ingredients this product is mapped to
    COUNT(DISTINCT ipm.ingredient_id) as mapped_ingredient_count,
    AVG(ipm.confidence_score) as avg_mapping_confidence,
    -- Flag products that need review
    CASE WHEN AVG(ipm.confidence_score) < 0.75 THEN true ELSE false END as needs_review
FROM products p
LEFT JOIN ingredient_product_mapping ipm ON p.id = ipm.product_id
GROUP BY p.id, p.name, p.brand_name, p.category_id, p.subcategory_id, p.allergens;

-- Create indexes for fast allergen filtering
CREATE UNIQUE INDEX idx_product_allergen_stats_id ON product_allergen_stats(id);
CREATE INDEX idx_product_allergen_stats_allergens_gin ON product_allergen_stats USING gin(allergens);
CREATE INDEX idx_product_allergen_stats_review ON product_allergen_stats(needs_review) WHERE needs_review = true;

-- Step 3: Create materialized view for recipe ingredient coverage
-- This shows how well our semantic matching covers recipe ingredients
CREATE MATERIALIZED VIEW recipe_ingredient_coverage AS
SELECT 
    r.id as recipe_id,
    r.title,
    COUNT(ri.id) as total_ingredients,
    COUNT(ri.matched_ingredient_id) as matched_ingredients,
    ROUND(
        (COUNT(ri.matched_ingredient_id)::DECIMAL / COUNT(ri.id)) * 100, 
        2
    ) as coverage_percentage,
    -- Count ingredients by category
    COUNT(DISTINCT CASE WHEN i.category = 'protein' THEN ri.id END) as protein_ingredients,
    COUNT(DISTINCT CASE WHEN i.category = 'vegetable' THEN ri.id END) as vegetable_ingredients,
    COUNT(DISTINCT CASE WHEN i.category = 'dairy' THEN ri.id END) as dairy_ingredients,
    COUNT(DISTINCT CASE WHEN i.category = 'grain' THEN ri.id END) as grain_ingredients,
    COUNT(DISTINCT CASE WHEN i.category = 'spice' THEN ri.id END) as spice_ingredients,
    -- Allergen analysis
    ARRAY_AGG(DISTINCT i.allergens) FILTER (WHERE i.allergens IS NOT NULL) as recipe_allergens
FROM recipes r
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN ingredients i ON ri.matched_ingredient_id = i.id
GROUP BY r.id, r.title;

-- Create indexes for recipe analysis
CREATE UNIQUE INDEX idx_recipe_coverage_id ON recipe_ingredient_coverage(recipe_id);
CREATE INDEX idx_recipe_coverage_percentage ON recipe_ingredient_coverage(coverage_percentage);
CREATE INDEX idx_recipe_coverage_allergens_gin ON recipe_ingredient_coverage USING gin(recipe_allergens);

-- Step 4: Create function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'Refreshing ingredient_product_stats...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY ingredient_product_stats;
    
    RAISE NOTICE 'Refreshing product_allergen_stats...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_allergen_stats;
    
    RAISE NOTICE 'Refreshing recipe_ingredient_coverage...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY recipe_ingredient_coverage;
    
    RAISE NOTICE 'All materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to get ingredient statistics
CREATE OR REPLACE FUNCTION get_ingredient_stats(ingredient_name TEXT)
RETURNS TABLE (
    ingredient_id INTEGER,
    canonical_name TEXT,
    category TEXT,
    product_count BIGINT,
    avg_confidence DECIMAL,
    high_confidence_count BIGINT,
    needs_review_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ips.id,
        ips.canonical_name,
        ips.category,
        ips.product_count,
        ips.avg_confidence,
        ips.high_confidence_count,
        ips.needs_review_count
    FROM ingredient_product_stats ips
    WHERE ips.canonical_name ILIKE '%' || ingredient_name || '%'
    ORDER BY ips.product_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to find products needing review
CREATE OR REPLACE FUNCTION get_products_needing_review(
    min_confidence DECIMAL DEFAULT 0.75,
    limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
    product_id BIGINT,
    product_name TEXT,
    brand_name TEXT,
    ingredient_name TEXT,
    confidence_score DECIMAL,
    match_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.brand_name,
        i.canonical_name,
        ipm.confidence_score,
        ipm.match_type
    FROM products p
    JOIN ingredient_product_mapping ipm ON p.id = ipm.product_id
    JOIN ingredients i ON ipm.ingredient_id = i.id
    WHERE ipm.confidence_score < min_confidence
    ORDER BY ipm.confidence_score ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function for performance monitoring
CREATE OR REPLACE FUNCTION get_performance_stats()
RETURNS TABLE (
    metric_name TEXT,
    metric_value BIGINT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Total Products'::TEXT, COUNT(*)::BIGINT, 'Number of products in database'::TEXT FROM products
    UNION ALL
    SELECT 'Total Ingredients'::TEXT, COUNT(*)::BIGINT, 'Number of ingredients in taxonomy'::TEXT FROM ingredients
    UNION ALL
    SELECT 'Total Mappings'::TEXT, COUNT(*)::BIGINT, 'Number of ingredient-product mappings'::TEXT FROM ingredient_product_mapping
    UNION ALL
    SELECT 'High Confidence Mappings'::TEXT, COUNT(*)::BIGINT, 'Mappings with confidence >= 0.90'::TEXT FROM ingredient_product_mapping WHERE confidence_score >= 0.90
    UNION ALL
    SELECT 'Low Confidence Mappings'::TEXT, COUNT(*)::BIGINT, 'Mappings with confidence < 0.75'::TEXT FROM ingredient_product_mapping WHERE confidence_score < 0.75
    UNION ALL
    SELECT 'Products with Allergens'::TEXT, COUNT(*)::BIGINT, 'Products tagged with allergens'::TEXT FROM products WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0
    UNION ALL
    SELECT 'Recipes with Good Coverage'::TEXT, COUNT(*)::BIGINT, 'Recipes with >80% ingredient coverage'::TEXT FROM recipe_ingredient_coverage WHERE coverage_percentage > 80;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create indexes for common query patterns
-- These optimize the most frequent queries in the semantic matching system

-- Index for ingredient lookups by name
CREATE INDEX IF NOT EXISTS idx_ingredients_canonical_lower ON ingredients(LOWER(canonical_name));
CREATE INDEX IF NOT EXISTS idx_ingredients_aliases_gin ON ingredients USING gin(aliases);

-- Index for product searches by category
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_subcategory_active ON products(subcategory_id, is_active) WHERE is_active = true;

-- Index for mapping lookups with confidence filtering
CREATE INDEX IF NOT EXISTS idx_mapping_ingredient_confidence ON ingredient_product_mapping(ingredient_id, confidence_score) WHERE confidence_score >= 0.80;
CREATE INDEX IF NOT EXISTS idx_mapping_product_confidence ON ingredient_product_mapping(product_id, confidence_score) WHERE confidence_score >= 0.80;

-- Index for allergen filtering
CREATE INDEX IF NOT EXISTS idx_products_allergens_gin ON products USING gin(allergens);
CREATE INDEX IF NOT EXISTS idx_products_no_allergens ON products(id) WHERE allergens IS NULL OR array_length(allergens, 1) = 0;

-- Step 9: Create function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_semantic_matching_performance(ingredient_name TEXT)
RETURNS TABLE (
    step_name TEXT,
    execution_time_ms INTEGER,
    rows_returned BIGINT,
    index_used TEXT
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    result_count BIGINT;
BEGIN
    -- Step 1: Ingredient lookup
    start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO result_count
    FROM ingredients 
    WHERE canonical_name = ingredient_name OR ingredient_name = ANY(aliases);
    
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Ingredient Lookup'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER,
        result_count,
        'idx_ingredients_canonical'::TEXT;
    
    -- Step 2: Product mapping lookup
    start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO result_count
    FROM ingredient_product_mapping ipm
    JOIN ingredients i ON ipm.ingredient_id = i.id
    WHERE i.canonical_name = ingredient_name
    AND ipm.confidence_score >= 0.80;
    
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Mapping Lookup'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER,
        result_count,
        'idx_mapping_ingredient_confidence'::TEXT;
    
    -- Step 3: Product details fetch
    start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO result_count
    FROM products p
    JOIN ingredient_product_mapping ipm ON p.id = ipm.product_id
    JOIN ingredients i ON ipm.ingredient_id = i.id
    WHERE i.canonical_name = ingredient_name
    AND ipm.confidence_score >= 0.80
    AND p.is_active = true;
    
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Product Fetch'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER,
        result_count,
        'idx_products_category_active'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Update migration status
INSERT INTO migration_status (phase, step, status, records_processed, total_records, started_at, completed_at)
VALUES (
    'Phase 6', 
    'Performance Optimization', 
    'completed', 
    0, 
    0, 
    NOW(), 
    NOW()
);

-- Step 11: Create initial refresh of materialized views
SELECT refresh_all_materialized_views();

RAISE NOTICE 'Phase 6: Performance Optimization completed successfully!';
RAISE NOTICE 'Materialized views created and refreshed';
RAISE NOTICE 'Performance monitoring functions created';
RAISE NOTICE 'Additional indexes created for common query patterns';
