#!/bin/bash

# ===== COMPLETE MIGRATION EXECUTION SCRIPT =====
# This script runs all phases in the correct order
# Based on your actual codebase and the execution plan

echo "==========================================" | tee -a migration.log
echo "STARTING COMPLETE MIGRATION TO SUPABASE" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "==========================================" | tee -a migration.log

# Make scripts executable
chmod +x run_migration_phase*.sh

# Phase 1: Current State Assessment
echo "" | tee -a migration.log
echo "=== PHASE 1: CURRENT STATE ASSESSMENT ===" | tee -a migration.log
echo "Please run check_supabase_current_state.sql in Supabase SQL Editor" | tee -a migration.log
echo "This will show you what's already populated vs. what's missing" | tee -a migration.log
echo "Press Enter when you've checked the current state..." | tee -a migration.log
read

# Phase 2: Foundation Scripts
echo "" | tee -a migration.log
echo "=== PHASE 2: FOUNDATION SCRIPTS ===" | tee -a migration.log
./run_migration_phase2.sh

echo "Press Enter to continue to Phase 3..." | tee -a migration.log
read

# Phase 3: Core Mapping Scripts (MOST CRITICAL!)
echo "" | tee -a migration.log
echo "=== PHASE 3: CORE MAPPING SCRIPTS ===" | tee -a migration.log
echo "This is the MOST CRITICAL phase - connects your 683k ingredients to products!" | tee -a migration.log
echo "This should fix your allergen filtering and search functionality!" | tee -a migration.log
./run_migration_phase3.sh

echo "Press Enter to continue to Phase 4..." | tee -a migration.log
read

# Phase 4: Product Tagging (CRITICAL for search!)
echo "" | tee -a migration.log
echo "=== PHASE 4: PRODUCT TAGGING ===" | tee -a migration.log
echo "This will enable ingredient search and allergen filtering!" | tee -a migration.log
./run_migration_phase4.sh

echo "Press Enter to continue to Phase 5..." | tee -a migration.log
read

# Phase 5: Specialized Mappings (Optional but recommended)
echo "" | tee -a migration.log
echo "=== PHASE 5: SPECIALIZED MAPPINGS ===" | tee -a migration.log
echo "This adds specialized ingredients and matching rules" | tee -a migration.log
./run_migration_phase5.sh

echo "Press Enter to continue to Phase 6..." | tee -a migration.log
read

# Phase 6: Verification & Debugging
echo "" | tee -a migration.log
echo "=== PHASE 6: VERIFICATION & DEBUGGING ===" | tee -a migration.log
echo "This audits the complete system and tests functionality" | tee -a migration.log
./run_migration_phase6.sh

echo "" | tee -a migration.log
echo "==========================================" | tee -a migration.log
echo "MIGRATION COMPLETED!" | tee -a migration.log
echo "Timestamp: $(date)" | tee -a migration.log
echo "==========================================" | tee -a migration.log

# Final Instructions
echo "" | tee -a migration.log
echo "=== NEXT STEPS ===" | tee -a migration.log
echo "1. Check migration.log for any errors" | tee -a migration.log
echo "2. Run the final health check SQL in Supabase" | tee -a migration.log
echo "3. Test your API endpoints:" | tee -a migration.log
echo "   curl -X POST http://localhost:5001/api/product/by-ingredient \\" | tee -a migration.log
echo "     -H \"Content-Type: application/json\" \\" | tee -a migration.log
echo "     -d '{\"ingredientName\": \"milk\", \"allergens\": [\"dairy\"]}'" | tee -a migration.log
echo "4. Test your frontend allergen filtering" | tee -a migration.log
echo "5. Update your ENVIRONMENT_SETUP.md with the results" | tee -a migration.log

echo "" | tee -a migration.log
echo "Expected Results:" | tee -a migration.log
echo "- Ingredient Mapping: 80-95% coverage" | tee -a migration.log
echo "- Product Tagging: 70-90% coverage" | tee -a migration.log
echo "- Allergen filtering should work" | tee -a migration.log
echo "- Ingredient search should work" | tee -a migration.log 