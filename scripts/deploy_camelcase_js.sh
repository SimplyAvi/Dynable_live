#!/bin/bash

# 🚀 CAMELCASE JAVASCRIPT-ONLY DEPLOYMENT
# Dynable App - JavaScript-Based Batch Processing

set -e  # Exit on any error

echo "🚀 CAMELCASE JAVASCRIPT-ONLY BATCH DEPLOYMENT"
echo "=============================================="
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
if [ ! -f "scripts/deploy_camelcase_javascript_only.js" ]; then
    echo "❌ Error: deploy_camelcase_javascript_only.js not found"
    exit 1
fi

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
        node scripts/deploy_camelcase_javascript_only.js --resume
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
echo "   - Method: JavaScript-only (no database functions needed)"
echo ""

# Ask for confirmation
read -p "⚠️  This will process ALL 243,114+ products in your database. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting JavaScript-only deployment..."
echo ""

# Run the deployment script
node scripts/deploy_camelcase_javascript_only.js "$@"

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "📊 Next steps:"
    echo "   - Test the application to ensure everything works"
    echo "   - Monitor for any issues in the next few hours"
    echo "   - If problems occur, use: node scripts/deploy_camelcase_javascript_only.js --rollback"
else
    echo ""
    echo "❌ Deployment failed or was interrupted!"
    echo ""
    echo "🔄 Recovery options:"
    echo "   - Resume: ./scripts/deploy_camelcase_js.sh (will detect and resume)"
    echo "   - Rollback: node scripts/deploy_camelcase_javascript_only.js --rollback"
    echo "   - Check logs above for specific errors"
    exit 1
fi 