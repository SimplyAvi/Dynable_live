#!/bin/bash

# ===== PHASE 2: FOUNDATION SCRIPTS =====
# Run this after checking current state with check_supabase_current_state.sql

echo "=== STARTING PHASE 2: FOUNDATION SCRIPTS ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log

# Step 1: Database Migrations
echo "=== Step 1: Running Database Migrations ===" | tee -a migration.log
cd server

# Check if sequelize-cli is available
if command -v npx &> /dev/null; then
    echo "Running Sequelize migrations..." | tee -a migration.log
    npx sequelize-cli db:migrate --config db/config/config.js 2>&1 | tee -a migration.log
else
    echo "Sequelize CLI not found, running migrations manually..." | tee -a migration.log
    echo "Please run migrations manually if needed:" | tee -a migration.log
    echo "  - 20240607-add-canonicalTag-to-food.js" | tee -a migration.log
    echo "  - 20240607-add-canonicalTagConfidence-to-food.js" | tee -a migration.log
    echo "  - 20240607-fix-description-column-length.js" | tee -a migration.log
    echo "  - add-confidence-to-ingredient-to-canonical.js" | tee -a migration.log
fi

# Step 2: Categories & Subcategories
echo "=== Step 2: Seeding Categories & Subcategories ===" | tee -a migration.log
echo "Running seedCategories.js..." | tee -a migration.log
time node seed/seedCategories.js 2>&1 | tee -a migration.log

echo "Running AssignSubcategories.js..." | tee -a migration.log
time node seed/AssignSubcategories.js 2>&1 | tee -a migration.log

# Step 3: Canonical System
echo "=== Step 3: Seeding Canonical System ===" | tee -a migration.log
echo "Running seedCanonicalSystem.js..." | tee -a migration.log
time node seed/seedCanonicalSystem.js 2>&1 | tee -a migration.log

echo "Running comprehensiveAllergenSystem.js..." | tee -a migration.log
time node seed/comprehensiveAllergenSystem.js 2>&1 | tee -a migration.log

echo "=== PHASE 2 COMPLETED ===" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "" | tee -a migration.log

# Verification
echo "=== VERIFICATION: Check the following in Supabase SQL Editor ===" | tee -a migration.log
echo "1. Run check_supabase_current_state.sql to see updated counts" | tee -a migration.log
echo "2. Verify Categories and Subcategories are populated" | tee -a migration.log
echo "3. Verify CanonicalIngredients are populated" | tee -a migration.log
echo "4. Verify AllergenDerivatives are populated" | tee -a migration.log
echo "" | tee -a migration.log
echo "If all looks good, proceed to Phase 3: Core Mapping Scripts" | tee -a migration.log 