#!/bin/bash

# ===== PHASE 6: VERIFICATION & DEBUGGING =====
# Run this after all other phases to verify the complete system

echo "=== STARTING PHASE 6: VERIFICATION & DEBUGGING ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "This phase audits the complete system and tests functionality" | tee -a migration.log

cd server

# Step 12: Audit the Complete System
echo "=== Step 12: Auditing the Complete System ===" | tee -a migration.log
echo "Running auditRecipeIngredientProducts.js..." | tee -a migration.log
time node seed/auditRecipeIngredientProducts.js 2>&1 | tee -a migration.log

echo "Running audit50RandomRecipes.js..." | tee -a migration.log
time node seed/audit50RandomRecipes.js 2>&1 | tee -a migration.log

# Step 13: Test Ingredient Search
echo "=== Step 13: Testing Ingredient Search ===" | tee -a migration.log
echo "Running testSingleIngredient.js..." | tee -a migration.log
time node seed/testSingleIngredient.js 2>&1 | tee -a migration.log

echo "=== PHASE 6 COMPLETED ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "" | tee -a migration.log

# Final Health Check
echo "=== FINAL HEALTH CHECK ===" | tee -a migration.log
echo "Run this SQL in Supabase for final verification:" | tee -a migration.log
echo "" | tee -a migration.log
echo "-- Final health check" | tee -a migration.log
echo "SELECT" | tee -a migration.log
echo "  'Ingredient Mapping' as metric," | tee -a migration.log
echo "  CONCAT(ROUND(COUNT(itc.id)::numeric / COUNT(DISTINCT i.name) * 100, 2), '%') as coverage" | tee -a migration.log
echo "FROM \"Ingredients\" i" | tee -a migration.log
echo "LEFT JOIN \"IngredientToCanonicals\" itc ON LOWER(TRIM(i.name)) = LOWER(itc.\"messyName\")" | tee -a migration.log
echo "" | tee -a migration.log
echo "UNION ALL" | tee -a migration.log
echo "" | tee -a migration.log
echo "SELECT" | tee -a migration.log
echo "  'Product Tagging' as metric," | tee -a migration.log
echo "  CONCAT(ROUND(COUNT(CASE WHEN \"canonicalTags\" IS NOT NULL AND array_length(\"canonicalTags\", 1) > 0 THEN 1 END)::numeric / COUNT(*) * 100, 2), '%') as coverage" | tee -a migration.log
echo "FROM \"Food\";" | tee -a migration.log
echo "" | tee -a migration.log
echo "Target Results:" | tee -a migration.log
echo "- Ingredient Mapping: 80-95% coverage" | tee -a migration.log
echo "- Product Tagging: 70-90% coverage" | tee -a migration.log 