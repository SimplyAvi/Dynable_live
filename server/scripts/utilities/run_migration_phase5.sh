#!/bin/bash

# ===== PHASE 5: SPECIALIZED MAPPINGS =====
# Run this after Phase 4 is complete for completeness and optimization

echo "=== STARTING PHASE 5: SPECIALIZED MAPPINGS ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "This phase adds specialized ingredients and matching rules" | tee -a migration.log

cd server

# Step 10: Add Specialized Ingredients
echo "=== Step 10: Adding Specialized Ingredients ===" | tee -a migration.log
echo "Running addMissingPizzaCanonicalIngredients.js..." | tee -a migration.log
time node seed/addMissingPizzaCanonicalIngredients.js 2>&1 | tee -a migration.log

echo "Running addMissingSubstituteIngredients.js..." | tee -a migration.log
time node seed/addMissingSubstituteIngredients.js 2>&1 | tee -a migration.log

echo "Running addMissingPureSubstituteProducts.js..." | tee -a migration.log
time node seed/addMissingPureSubstituteProducts.js 2>&1 | tee -a migration.log

# Step 11: Ingredient Matching Rules
echo "=== Step 11: Setting Ingredient Matching Rules ===" | tee -a migration.log
echo "Running seedIngredientMatchingRules.js..." | tee -a migration.log
time node seed/seedIngredientMatchingRules.js 2>&1 | tee -a migration.log

echo "=== PHASE 5 COMPLETED ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "" | tee -a migration.log

echo "=== OPTIONAL: Additional Data Processing ===" | tee -a migration.log
echo "If you want to add more complex mappings, run:" | tee -a migration.log
echo "  node scripts/data-processing/add_complex_ingredient_mappings.js" | tee -a migration.log
echo "  node scripts/data-processing/add_frequently_unmapped.js" | tee -a migration.log
echo "  node scripts/data-processing/add_missing_canonicals_and_products.js" | tee -a migration.log 