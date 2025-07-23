#!/bin/bash

# ===== PHASE 4: PRODUCT TAGGING =====
# This phase will enable ingredient search and allergen filtering
# Run this after Phase 3 is complete

echo "=== STARTING PHASE 4: PRODUCT TAGGING ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "This phase will enable ingredient search and allergen filtering!" | tee -a migration.log

cd server

# Step 8: Tag Products with Canonical Ingredients (CRITICAL for search!)
echo "=== Step 8: Tagging Products with Canonical Ingredients ===" | tee -a migration.log
echo "This will enable your ingredient search functionality!" | tee -a migration.log
echo "Running suggestProductCanonicalTags.js..." | tee -a migration.log
time node seed/suggestProductCanonicalTags.js 2>&1 | tee -a migration.log

# Verify Step 8
echo "=== VERIFYING Step 8 Results ===" | tee -a migration.log
echo "Check product tagging in Supabase:" | tee -a migration.log
echo "Expected: Should see products tagged with canonical ingredients" | tee -a migration.log

# Step 9: Set Product Flags
echo "=== Step 9: Setting Pure Ingredient Flags ===" | tee -a migration.log
echo "Running setPureIngredientFlags.js..." | tee -a migration.log
time node seed/setPureIngredientFlags.js 2>&1 | tee -a migration.log

echo "=== PHASE 4 COMPLETED ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "" | tee -a migration.log

# Critical Verification
echo "=== CRITICAL VERIFICATION ===" | tee -a migration.log
echo "Run this SQL in Supabase to check product tagging:" | tee -a migration.log
echo "" | tee -a migration.log
echo "SELECT" | tee -a migration.log
echo "  COUNT(*) as total_food_products," | tee -a migration.log
echo "  COUNT(CASE WHEN \"canonicalTags\" IS NOT NULL AND array_length(\"canonicalTags\", 1) > 0 THEN 1 END) as tagged_products," | tee -a migration.log
echo "  ROUND(COUNT(CASE WHEN \"canonicalTags\" IS NOT NULL AND array_length(\"canonicalTags\", 1) > 0 THEN 1 END)::numeric / COUNT(*) * 100, 2) as percentage_tagged" | tee -a migration.log
echo "FROM \"Food\";" | tee -a migration.log
echo "" | tee -a migration.log
echo "Target: Should see 70-90% product tagging coverage" | tee -a migration.log
echo "If tagging coverage is good, your ingredient search should work!" | tee -a migration.log
echo "" | tee -a migration.log
echo "=== TEST YOUR API ENDPOINTS ===" | tee -a migration.log
echo "Test allergen filtering (should work now!):" | tee -a migration.log
echo "curl -X POST http://localhost:5001/api/product/by-ingredient \\" | tee -a migration.log
echo "  -H \"Content-Type: application/json\" \\" | tee -a migration.log
echo "  -d '{\"ingredientName\": \"milk\", \"allergens\": [\"dairy\"]}'" | tee -a migration.log 