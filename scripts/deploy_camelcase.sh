#!/bin/bash

# 🚀 CAMELCASE DEPLOYMENT WRAPPER SCRIPT
# Dynable App - Batch Processing Deployment

set -e  # Exit on any error

echo "🚀 CAMELCASE BATCH DEPLOYMENT"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please ensure your .env file contains SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
source .env

# Check required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file"
    exit 1
fi

echo "✅ Environment variables loaded successfully"
echo ""

# Check if Node.js script exists
if [ ! -f "scripts/deploy_camelcase_batch_processing.js" ]; then
    echo "❌ Error: deploy_camelcase_batch_processing.js not found"
    exit 1
fi

# Check if database rules files exist
echo "📋 Checking database rules files..."
required_files=(
    "database/rules/categories.sql"
    "database/rules/functions.sql"
    "database/rules/constraints.sql"
    "database/rules/triggers.sql"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Required file not found: $file"
        exit 1
    fi
done

echo "✅ All required files found"
echo ""

# Create backups directory if it doesn't exist
mkdir -p database/backups

# Check for previous progress
if [ -f "database/backups/deployment_progress.json" ]; then
    echo "🔄 Found previous deployment progress!"
    echo ""
    read -p "Do you want to resume from where you left off? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Resuming previous deployment..."
        echo ""
        node scripts/deploy_camelcase_batch_processing.js --resume
        exit $?
    else
        echo "🔄 Starting fresh deployment..."
        echo ""
    fi
fi

# Show deployment information
echo "📊 DEPLOYMENT INFORMATION:"
echo "   - Database URL: $SUPABASE_URL"
echo "   - Batch Size: 1000 products"
echo "   - Estimated batches: 244+ (for 243,114+ products)"
echo "   - Estimated time: 30-60 minutes"
echo "   - Resume capability: Yes (if interrupted)"
echo "   - Rollback capability: Yes"
echo ""

# Ask for confirmation
read -p "⚠️  This will process ALL 243,114+ products in your database. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Run the deployment script
node scripts/deploy_camelcase_batch_processing.js "$@"

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "📊 Next steps:"
    echo "   - Test the application to ensure everything works"
    echo "   - Monitor for any issues in the next few hours"
    echo "   - If problems occur, use: node scripts/deploy_camelcase_batch_processing.js --rollback"
else
    echo ""
    echo "❌ Deployment failed or was interrupted!"
    echo ""
    echo "🔄 Recovery options:"
    echo "   - Resume: ./scripts/deploy_camelcase.sh (will detect and resume)"
    echo "   - Rollback: node scripts/deploy_camelcase_batch_processing.js --rollback"
    echo "   - Check logs above for specific errors"
    exit 1
fi 