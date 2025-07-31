#!/bin/bash

# 🔧 DEPLOY DATABASE RULES SCRIPT
# Dynable App - Database Rules Deployment

set -e  # Exit on any error

echo "🔧 Deploying database rules and constraints..."
echo "=============================================="

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

# Function to run SQL file
run_sql_file() {
    local file="$1"
    local description="$2"
    
    echo "📝 Running $description..."
    
    if [ -f "$file" ]; then
        psql "$DB_URL" -f "$file" -v ON_ERROR_STOP=1
        echo "✅ $description completed"
    else
        echo "❌ Error: SQL file not found: $file"
        exit 1
    fi
}

# Function to run SQL command
run_sql_command() {
    local command="$1"
    local description="$2"
    
    echo "📝 Running $description..."
    psql "$DB_URL" -c "$command" -v ON_ERROR_STOP=1
    echo "✅ $description completed"
}

# Step 1: Create allergen categories
echo ""
echo "🏷️  STEP 1: Creating allergen categories..."
run_sql_file "database/rules/categories.sql" "allergen categories"

# Step 2: Create database functions
echo ""
echo "🔧 STEP 2: Creating database functions..."
run_sql_file "database/rules/functions.sql" "database functions"

# Step 3: Create database triggers
echo ""
echo "🔄 STEP 3: Creating database triggers..."
run_sql_file "database/rules/triggers.sql" "database triggers"

# Step 4: Add database constraints
echo ""
echo "🔒 STEP 4: Adding database constraints..."
run_sql_file "database/rules/constraints.sql" "database constraints"

# Step 5: Test the deployment
echo ""
echo "🧪 STEP 5: Testing deployment..."

# Test allergen validation
echo "Testing allergen validation..."
run_sql_command "
SELECT 
    validate_allergen_array(ARRAY['milk', 'eggs']) as valid_test,
    validate_allergen_array(ARRAY['tree nuts', 'gluten_free']) as invalid_test;
" "allergen validation test"

# Test allergen standardization
echo "Testing allergen standardization..."
run_sql_command "
SELECT 
    standardize_allergen_array(ARRAY['Tree Nuts', 'gluten_free']) as standardized;
" "allergen standardization test"

# Test free-from contradiction detection
echo "Testing free-from contradiction detection..."
run_sql_command "
SELECT 
    clean_free_from_contradictions(ARRAY['gluten', 'milk'], 'Gluten Free Bread') as cleaned;
" "free-from contradiction test"

# Test allergen statistics
echo "Testing allergen statistics..."
run_sql_command "
SELECT * FROM get_allergen_statistics();
" "allergen statistics test"

# Test violation checking
echo "Testing violation checking..."
run_sql_command "
SELECT violation_type, COUNT(*) as count 
FROM check_allergen_rule_violations() 
GROUP BY violation_type 
ORDER BY count DESC;
" "violation checking test"

# Step 6: Enable strict validation (optional)
echo ""
echo "🔒 STEP 6: Enabling strict validation..."
read -p "Do you want to enable strict validation? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    run_sql_command "SELECT enable_strict_allergen_validation();" "strict validation"
    echo "✅ Strict validation enabled"
else
    echo "ℹ️  Strict validation skipped (can be enabled later)"
fi

# Step 7: Create monitoring views
echo ""
echo "📊 STEP 7: Creating monitoring views..."
run_sql_command "
CREATE OR REPLACE VIEW allergen_compliance_dashboard AS
SELECT 
    'Total Products' as metric,
    COUNT(*) as value
FROM \"IngredientCategorized\"
UNION ALL
SELECT 
    'Products with Allergens',
    COUNT(*) 
FROM \"IngredientCategorized\" 
WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0
UNION ALL
SELECT 
    'Products with Violations',
    COUNT(DISTINCT product_id) 
FROM check_allergen_rule_violations()
UNION ALL
SELECT 
    'Compliance Rate',
    ROUND(
        (COUNT(*) FILTER (WHERE allergens IS NULL OR array_length(allergens, 1) = 0) + 
         COUNT(*) FILTER (WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0 AND 
            NOT EXISTS (SELECT 1 FROM check_allergen_rule_violations() v WHERE v.product_id = \"IngredientCategorized\".id))
        )::NUMERIC / COUNT(*) * 100, 2
    )
FROM \"IngredientCategorized\";
" "monitoring dashboard"

# Step 8: Final validation
echo ""
echo "🎯 STEP 8: Final validation..."

# Check if all functions exist
echo "Checking database functions..."
run_sql_command "
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'standardize_allergen_name',
    'clean_free_from_contradictions',
    'validate_allergen_array',
    'check_allergen_rule_violations',
    'get_allergen_statistics'
)
ORDER BY routine_name;
" "function existence check"

# Check if all triggers exist
echo "Checking database triggers..."
run_sql_command "
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name IN (
    'trigger_standardize_allergens',
    'trigger_log_allergen_changes'
)
ORDER BY trigger_name;
" "trigger existence check"

# Check if all constraints exist
echo "Checking database constraints..."
run_sql_command "
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'IngredientCategorized' 
AND constraint_name LIKE 'check_allergens_%'
ORDER BY constraint_name;
" "constraint existence check"

echo ""
echo "🎉 DATABASE RULES DEPLOYMENT COMPLETE!"
echo "======================================"
echo "✅ Allergen categories created"
echo "✅ Database functions deployed"
echo "✅ Database triggers activated"
echo "✅ Database constraints enforced"
echo "✅ Monitoring dashboard created"
echo ""
echo "📊 Next steps:"
echo "1. Test the application with allergen input"
echo "2. Monitor the compliance dashboard"
echo "3. Run periodic cleanup: ./scripts/periodic_cleanup.sh"
echo "4. Check violations: SELECT * FROM get_allergen_violation_summary();"
echo ""
echo "🔧 Management commands:"
echo "- Enable strict validation: SELECT enable_strict_allergen_validation();"
echo "- Disable strict validation: SELECT disable_strict_allergen_validation();"
echo "- Check violations: SELECT * FROM check_allergen_rule_violations();"
echo "- View compliance: SELECT * FROM allergen_compliance_dashboard;" 