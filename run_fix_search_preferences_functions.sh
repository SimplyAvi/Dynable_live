#!/bin/bash

# 🔧 FIX SEARCH PREFERENCES FUNCTIONS - CAMELCASE COLUMN NAMES
# This script fixes the database functions to use the correct column names

echo "🔧 Fixing search preferences functions to use camelCase column names..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file"
    exit 1
fi

# Extract database connection details from SUPABASE_URL
DB_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||')
DB_URL="postgresql://postgres.${DB_HOST}:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

echo "🔧 Connecting to database: ${DB_HOST}"

# Run the fix script
psql "$DB_URL" -f fix_search_preferences_functions.sql

if [ $? -eq 0 ]; then
    echo "✅ Search preferences functions fixed successfully!"
    echo "✅ Database functions now use camelCase column names (selectedallergens)"
    echo "✅ Frontend should now work without database errors"
else
    echo "❌ Error fixing search preferences functions"
    exit 1
fi 