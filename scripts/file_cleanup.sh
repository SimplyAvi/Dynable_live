#!/bin/bash

# 🧹 DYNABLE FILE CLEANUP SCRIPT
# This script removes unnecessary files identified in the comprehensive analysis

echo "🧹 Starting Dynable file cleanup..."
echo "=================================="

# Create backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 Created backup directory: $BACKUP_DIR"

# Function to safely delete files with backup
safe_delete() {
    local file="$1"
    local reason="$2"
    
    if [ -e "$file" ]; then
        echo "🗑️  Deleting: $file ($reason)"
        # Move to backup instead of deleting
        mv "$file" "$BACKUP_DIR/"
    else
        echo "⚠️  File not found: $file"
    fi
}

# Function to safely delete directories with backup
safe_delete_dir() {
    local dir="$1"
    local reason="$2"
    
    if [ -d "$dir" ]; then
        echo "🗑️  Deleting directory: $dir ($reason)"
        # Move to backup instead of deleting
        mv "$dir" "$BACKUP_DIR/"
    else
        echo "⚠️  Directory not found: $dir"
    fi
}

echo ""
echo "🚨 STEP 1: Deleting duplicate files..."
echo "--------------------------------------"

# Delete exact duplicates
safe_delete "src/components/AllergyFilter/AllergyFilter copy.js" "duplicate file"
safe_delete "src/pages/Homepage copy.js" "duplicate file"
safe_delete "src/pages/Homepage.css.bak" "backup file"
safe_delete "src/pages/Homepage.js.bak" "backup file"

echo ""
echo "🗑️  STEP 2: Deleting legacy data bloat..."
echo "------------------------------------------"

# Delete legacy product data (500,000+ lines)
safe_delete_dir "server/scripts/legacy/seed/Data/Products/split_*.js" "legacy product data"
safe_delete_dir "server/scripts/legacy/seed/Data/Recipes/" "legacy recipe data"

# Delete legacy test files
safe_delete_dir "server/scripts/legacy/seed/test*.js" "legacy test files"
safe_delete_dir "server/test/" "unused test directory"
safe_delete_dir "server/tests/" "unused test directory"
safe_delete_dir "src/tests/" "unused test directory"
safe_delete_dir "scripts/testing/" "unused test directory"
safe_delete_dir "docs/enterprise_allergen_system/testing/" "unused test directory"

# Delete backup files
safe_delete "database/backups/test.dump" "test backup"

echo ""
echo "🔧 STEP 3: Deleting unused scripts..."
echo "-------------------------------------"

# Delete one-time migration scripts
safe_delete "run_migration.js" "one-time migration script"
safe_delete "run_migration_simple.js" "one-time migration script"
safe_delete "update_merge_function.js" "one-time migration script"
safe_delete "execute_phase1_sql.js" "one-time migration script"
safe_delete "execute_database_indexes.js" "one-time migration script"
safe_delete "run_database_optimization.js" "one-time migration script"
safe_delete "database_analysis_script.js" "one-time analysis script"
safe_delete "direct_database_analysis.js" "one-time analysis script"
safe_delete "comprehensive_bulletproof_test.js" "one-time test script"
safe_delete "add_test_preferences.js" "one-time script"
safe_delete "setup_precomputed_system.js" "one-time script"

# Delete SQL files
safe_delete "update_merge_logic.sql" "one-time SQL script"
safe_delete "add_performance_indexes.sql" "one-time SQL script"
safe_delete "fix_column_name_issue.sql" "one-time SQL script"
safe_delete "fix_concurrent_index_issue.sql" "one-time SQL script"
safe_delete "check_substitute_mappings_schema.sql" "one-time SQL script"
safe_delete "database_schema_analysis.sql" "one-time SQL script"

echo ""
echo "🗂️  STEP 4: Deleting legacy seed scripts..."
echo "-------------------------------------------"

# Delete all legacy seed scripts
safe_delete_dir "server/scripts/legacy/seed/" "legacy seed scripts"
safe_delete_dir "server/scripts/framework/" "legacy framework scripts"
safe_delete_dir "server/scripts/data-enrichment/" "legacy data enrichment scripts"
safe_delete_dir "server/scripts/data-processing/" "legacy data processing scripts"
safe_delete_dir "server/scripts/monitoring/" "legacy monitoring scripts"
safe_delete_dir "server/scripts/debug/" "legacy debug scripts"

echo ""
echo "🔍 STEP 5: Finding and deleting empty files..."
echo "---------------------------------------------"

# Find and delete empty files
find . -type f -empty -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
    safe_delete "$file" "empty file"
done

echo ""
echo "📊 STEP 6: Finding and deleting backup files..."
echo "---------------------------------------------"

# Find and delete backup files
find . -name "*.bak" -o -name "*.backup" -o -name "*~" -o -name "*.old" | while read file; do
    safe_delete "$file" "backup file"
done

echo ""
echo "🎯 STEP 7: Finding and deleting copy files..."
echo "--------------------------------------------"

# Find and delete copy files
find . -name "* copy*" -o -name "*copy*" -o -name "*Copy*" | while read file; do
    safe_delete "$file" "copy file"
done

echo ""
echo "📈 CLEANUP SUMMARY"
echo "=================="

# Count files in backup directory
BACKUP_COUNT=$(find "$BACKUP_DIR" -type f | wc -l)
echo "📁 Files moved to backup: $BACKUP_COUNT"
echo "📁 Backup location: $BACKUP_DIR"

# Calculate space saved
if command -v du >/dev/null 2>&1; then
    SPACE_SAVED=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    echo "💾 Space saved: $SPACE_SAVED"
fi

echo ""
echo "✅ File cleanup complete!"
echo "========================="
echo "📝 Note: Files were moved to backup instead of deleted"
echo "📝 To permanently delete, run: rm -rf $BACKUP_DIR"
echo "📝 To restore files, run: mv $BACKUP_DIR/* ."
echo ""
echo "🎉 Next steps:"
echo "1. Run database cleanup: node scripts/database_cleanup.js"
echo "2. Test application functionality"
echo "3. Update hardcoded values in remaining files"
echo "4. Reorganize folder structure" 