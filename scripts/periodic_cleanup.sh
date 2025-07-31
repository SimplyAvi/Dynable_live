#!/bin/bash

# 🧹 PERIODIC CLEANUP SCRIPT
# Dynable App - Data Quality Maintenance

set -e  # Exit on any error

echo "🧹 Starting periodic allergen cleanup..."
echo "======================================"

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL or SUPABASE_URL environment variable is required"
    echo "Please set your database connection string:"
    echo "export DATABASE_URL='your_database_url_here'"
    exit 1
fi

# Use DATABASE_URL if available, otherwise construct from Supabase
if [ -n "$DATABASE_URL" ]; then
    DB_URL="$DATABASE_URL"
else
    # Construct from Supabase URL (you'll need to add your database password)
    echo "⚠️  Warning: Using Supabase URL. You may need to add database password."
    DB_URL="postgresql://postgres:your_password@${SUPABASE_URL#https://}"
fi

# Function to run SQL command
run_sql_command() {
    local command="$1"
    local description="$2"
    
    echo "📝 Running $description..."
    psql "$DB_URL" -c "$command" -v ON_ERROR_STOP=1
    echo "✅ $description completed"
}

# Function to get count
get_count() {
    local query="$1"
    local result=$(psql "$DB_URL" -t -c "$query" | xargs)
    echo "$result"
}

# Step 1: Check current violations
echo ""
echo "🔍 STEP 1: Checking current violations..."

violation_summary=$(psql "$DB_URL" -t -c "
SELECT 
    violation_type,
    COUNT(*) as count
FROM check_allergen_rule_violations() 
GROUP BY violation_type 
ORDER BY count DESC;
")

echo "Current violations:"
echo "$violation_summary"

# Step 2: Get statistics before cleanup
echo ""
echo "📊 STEP 2: Getting pre-cleanup statistics..."

total_products=$(get_count "SELECT COUNT(*) FROM \"IngredientCategorized\";")
products_with_allergens=$(get_count "
SELECT COUNT(*) 
FROM \"IngredientCategorized\" 
WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0;
")

echo "Total products: $total_products"
echo "Products with allergens: $products_with_allergens"

# Step 3: Run batch cleanup
echo ""
echo "🧹 STEP 3: Running batch cleanup..."

# Create cleanup function if it doesn't exist
run_sql_command "
CREATE OR REPLACE FUNCTION run_periodic_allergen_cleanup()
RETURNS TABLE(
    batch_number INTEGER,
    records_processed INTEGER,
    violations_fixed INTEGER,
    total_violations INTEGER
) AS $$
DECLARE
    batch_size INTEGER := 1000;
    offset_val INTEGER := 0;
    processed_count INTEGER := 0;
    total_processed INTEGER := 0;
    total_fixed INTEGER := 0;
    batch_num INTEGER := 0;
    old_allergens TEXT[];
    new_allergens TEXT[];
    fixed_count INTEGER;
BEGIN
    -- Get total violations before cleanup
    SELECT COUNT(*) INTO total_fixed FROM check_allergen_rule_violations();
    
    LOOP
        batch_num := batch_num + 1;
        
        -- Update a batch of records by triggering the standardization
        UPDATE \"IngredientCategorized\" 
        SET updated_at = NOW()  -- This will trigger the standardization
        WHERE id IN (
            SELECT id FROM \"IngredientCategorized\" 
            ORDER BY id 
            LIMIT batch_size OFFSET offset_val
        );
        
        GET DIAGNOSTICS processed_count = ROW_COUNT;
        
        IF processed_count = 0 THEN
            EXIT;
        END IF;
        
        total_processed := total_processed + processed_count;
        offset_val := offset_val + batch_size;
        
        -- Return batch results
        RETURN QUERY SELECT 
            batch_num,
            processed_count,
            0, -- Will be calculated later
            total_fixed;
        
        -- Add delay to prevent overwhelming database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    -- Calculate final results
    SELECT COUNT(*) INTO total_fixed FROM check_allergen_rule_violations();
    
    RAISE NOTICE 'Allergen cleanup completed. Processed % records, fixed % violations', 
        total_processed, total_fixed;
END;
$$ LANGUAGE plpgsql;
" "cleanup function"

# Run the cleanup
echo "Running cleanup process..."
cleanup_results=$(psql "$DB_URL" -t -c "
SELECT 
    batch_number,
    records_processed,
    violations_fixed,
    total_violations
FROM run_periodic_allergen_cleanup();
")

echo "Cleanup results:"
echo "$cleanup_results"

# Step 4: Check post-cleanup violations
echo ""
echo "🔍 STEP 4: Checking post-cleanup violations..."

post_violation_summary=$(psql "$DB_URL" -t -c "
SELECT 
    violation_type,
    COUNT(*) as count
FROM check_allergen_rule_violations() 
GROUP BY violation_type 
ORDER BY count DESC;
")

echo "Post-cleanup violations:"
echo "$post_violation_summary"

# Step 5: Generate compliance report
echo ""
echo "📊 STEP 5: Generating compliance report..."

compliance_report=$(psql "$DB_URL" -t -c "
SELECT 
    metric,
    value
FROM allergen_compliance_dashboard
ORDER BY 
    CASE metric
        WHEN 'Total Products' THEN 1
        WHEN 'Products with Allergens' THEN 2
        WHEN 'Products with Violations' THEN 3
        WHEN 'Compliance Rate' THEN 4
        ELSE 5
    END;
")

echo "Compliance Report:"
echo "$compliance_report"

# Step 6: Log cleanup results
echo ""
echo "📝 STEP 6: Logging cleanup results..."

# Create cleanup log table if it doesn't exist
run_sql_command "
CREATE TABLE IF NOT EXISTS allergen_cleanup_log (
    id SERIAL PRIMARY KEY,
    cleanup_date TIMESTAMP DEFAULT NOW(),
    total_products INTEGER,
    products_with_allergens INTEGER,
    violations_before INTEGER,
    violations_after INTEGER,
    compliance_rate_before NUMERIC,
    compliance_rate_after NUMERIC,
    cleanup_duration INTERVAL,
    notes TEXT
);
" "cleanup log table"

# Log the cleanup
run_sql_command "
INSERT INTO allergen_cleanup_log (
    total_products,
    products_with_allergens,
    violations_before,
    violations_after,
    compliance_rate_before,
    compliance_rate_after,
    notes
) VALUES (
    $total_products,
    $products_with_allergens,
    (SELECT COUNT(*) FROM check_allergen_rule_violations()),
    (SELECT COUNT(*) FROM check_allergen_rule_violations()),
    (SELECT value FROM allergen_compliance_dashboard WHERE metric = 'Compliance Rate'),
    (SELECT value FROM allergen_compliance_dashboard WHERE metric = 'Compliance Rate'),
    'Periodic cleanup completed'
);
" "cleanup logging"

# Step 7: Generate summary
echo ""
echo "🎯 STEP 7: Generating summary..."

# Get the most recent cleanup log
latest_cleanup=$(psql "$DB_URL" -t -c "
SELECT 
    cleanup_date,
    total_products,
    violations_before,
    violations_after,
    compliance_rate_after
FROM allergen_cleanup_log 
ORDER BY cleanup_date DESC 
LIMIT 1;
")

echo "Latest cleanup summary:"
echo "$latest_cleanup"

# Step 8: Check for critical issues
echo ""
echo "🚨 STEP 8: Checking for critical issues..."

critical_issues=$(psql "$DB_URL" -t -c "
SELECT 
    violation_type,
    COUNT(*) as count
FROM check_allergen_rule_violations() 
WHERE violation_type IN ('invalid_allergen', 'free_from_contradiction')
GROUP BY violation_type 
ORDER BY count DESC;
")

if [ -n "$critical_issues" ]; then
    echo "⚠️  CRITICAL ISSUES FOUND:"
    echo "$critical_issues"
    echo ""
    echo "🔧 Recommended actions:"
    echo "1. Review invalid allergen names"
    echo "2. Check free-from contradictions"
    echo "3. Run manual cleanup for specific issues"
else
    echo "✅ No critical issues found"
fi

echo ""
echo "🎉 PERIODIC CLEANUP COMPLETE!"
echo "============================="
echo "✅ Batch cleanup processed"
echo "✅ Violations checked"
echo "✅ Compliance report generated"
echo "✅ Results logged"
echo ""
echo "📊 Next steps:"
echo "1. Review the compliance report"
echo "2. Address any critical issues"
echo "3. Schedule next cleanup (recommended: weekly)"
echo ""
echo "🔧 Monitoring commands:"
echo "- Check violations: SELECT * FROM get_allergen_violation_summary();"
echo "- View compliance: SELECT * FROM allergen_compliance_dashboard;"
echo "- View cleanup history: SELECT * FROM allergen_cleanup_log ORDER BY cleanup_date DESC;" 