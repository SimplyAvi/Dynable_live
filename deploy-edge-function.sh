#!/bin/bash

# 🚀 Deploy Edge Function to Supabase
# This script deploys the recipe-processor Edge Function

echo "🚀 Starting Edge Function deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

# Deploy the Edge Function
echo "📦 Deploying recipe-processor Edge Function..."
supabase functions deploy recipe-processor

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "🔗 Your Edge Function is now available at:"
    echo "   https://your-project-ref.supabase.co/functions/v1/recipe-processor"
    echo ""
    echo "📝 To test it, you can use curl:"
    echo "   curl -X POST https://your-project-ref.supabase.co/functions/v1/recipe-processor \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
    echo "     -d '{\"recipeId\": 1, \"userAllergens\": [\"milk\", \"gluten\"]}'"
    echo ""
    echo "🎉 Recipe processing is now server-side and scalable!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi

