#!/bin/bash

# ===== PHASE 3: CORE MAPPING SCRIPTS =====
# This is the MOST CRITICAL phase - connects your 683k ingredients to products
# Run this after Phase 2 is complete

echo "=== STARTING PHASE 3: CORE MAPPING SCRIPTS ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "This phase will connect your 683,784 ingredients to products!" | tee -a migration.log

cd server

# Step 4: Clean Ingredient Names
echo "=== Step 4: Cleaning Ingredient Names ===" | tee -a migration.log
echo "Running cleanIngredientName.js..." | tee -a migration.log
time node scripts/data-processing/cleanIngredientName.js 2>&1 | tee -a migration.log

# Step 5: Auto-Map Ingredients to Canonicals (CRITICAL!)
echo "=== Step 5: Auto-Mapping Ingredients to Canonicals ===" | tee -a migration.log
echo "This is the most important step - mapping your 683k ingredients!" | tee -a migration.log
time node seed/autoMapAndAddIngredientMappings.js 2>&1 | tee -a migration.log

# Verify Step 5
echo "=== VERIFYING Step 5 Results ===" | tee -a migration.log
echo "Check IngredientToCanonicals count in Supabase:" | tee -a migration.log
echo "Expected: Should see significant increase in mappings" | tee -a migration.log

# Step 6: Add Missing Ingredient Mappings
echo "=== Step 6: Adding Missing Ingredient Mappings ===" | tee -a migration.log
echo "Running addMissingIngredientMappings.js..." | tee -a migration.log
time node seed/addMissingIngredientMappings.js 2>&1 | tee -a migration.log

echo "Running addMissingMappings.js..." | tee -a migration.log
time node seed/addMissingMappings.js 2>&1 | tee -a migration.log

# Step 7: Add Missing Core Products
echo "=== Step 7: Adding Missing Core Products ===" | tee -a migration.log
echo "Running addMissingPureProducts.js..." | tee -a migration.log
time node seed/addMissingPureProducts.js 2>&1 | tee -a migration.log

echo "Running add_core_pure_products.js..." | tee -a migration.log
time node scripts/data-processing/add_core_pure_products.js 2>&1 | tee -a migration.log

echo "=== PHASE 3 COMPLETED ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "" | tee -a migration.log

# Critical Verification
echo "=== CRITICAL VERIFICATION ===" | tee -a migration.log
echo "Run this SQL in Supabase to check mapping coverage:" | tee -a migration.log
echo "" | tee -a migration.log
echo "SELECT" | tee -a migration.log
echo "  COUNT(DISTINCT i.name) as total_unique_ingredients," | tee -a migration.log
echo "  COUNT(itc.id) as mapped_ingredients," | tee -a migration.log
echo "  ROUND(COUNT(itc.id)::numeric / COUNT(DISTINCT i.name) * 100, 2) as mapping_percentage" | tee -a migration.log
echo "FROM \"Ingredients\" i" | tee -a migration.log
echo "LEFT JOIN \"IngredientToCanonicals\" itc ON LOWER(TRIM(i.name)) = LOWER(itc.\"messyName\");" | tee -a migration.log
echo "" | tee -a migration.log
echo "Target: Should see 70-90% mapping coverage" | tee -a migration.log
echo "If mapping coverage is good, proceed to Phase 4: Product Tagging" | tee -a migration.log 