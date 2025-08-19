# Scripts

**Author:** Justin Linzan  
**Date:** January 2025  
**Status:** ✅ ACTIVE - Clean and Organized

## Overview

This directory contains utility scripts for debugging, testing, and database operations. All scripts are organized by purpose for easy maintenance and execution. The directory has been cleaned and organized as part of the comprehensive project cleanup.

## Directory Structure

```
scripts/
├── README.md                           # This file
├── debug/                              # Debug and troubleshooting scripts
│   ├── check_rls_policies.js
│   ├── debug_cart_merge.js
│   └── fix_rls_policies.js
├── migrations/                         # Database migration scripts
│   └── [migration-specific scripts]
├── testing/                           # Test scripts
│   ├── test_cart_insert.js
│   ├── test_cart_merge_system.js
│   ├── test_complete_cart_flow.js
│   ├── test_rls_carts.js
│   ├── test_simple_cart_merge.js
│   └── test_specific_cart.js
└── *.sh                               # Shell scripts (68 files)
```

## Script Categories

### 🔍 Debug Scripts
**Location:** `scripts/debug/`

#### `check_rls_policies.js`
**Purpose:** Verify RLS policies are working correctly  
**Usage:** `node scripts/debug/check_rls_policies.js`

#### `debug_cart_merge.js`
**Purpose:** Debug cart merge operations  
**Usage:** `node scripts/debug/debug_cart_merge.js`

#### `fix_rls_policies.js`
**Purpose:** Apply RLS policy fixes  
**Usage:** `node scripts/debug/fix_rls_policies.js`

### 🧪 Test Scripts
**Location:** `scripts/testing/`

#### `test_cart_insert.js`
**Purpose:** Test cart insertion functionality  
**Usage:** `node scripts/testing/test_cart_insert.js`

#### `test_cart_merge_system.js`
**Purpose:** Test cart merge system  
**Usage:** `node scripts/testing/test_cart_merge_system.js`

#### `test_complete_cart_flow.js`
**Purpose:** Test complete cart workflow  
**Usage:** `node scripts/testing/test_complete_cart_flow.js`

#### `test_rls_carts.js`
**Purpose:** Test RLS policies on carts  
**Usage:** `node scripts/testing/test_rls_carts.js`

#### `test_simple_cart_merge.js`
**Purpose:** Test simple cart merge  
**Usage:** `node scripts/testing/test_simple_cart_merge.js`

#### `test_specific_cart.js`
**Purpose:** Test specific cart functionality  
**Usage:** `node scripts/testing/test_specific_cart.js`

### 🛠️ Shell Scripts
**Location:** `scripts/` (root of scripts directory)

**Key Scripts:**
- `complete_remaining.sh` - Complete remaining cleanup tasks
- `dynable_cleanup.sh` - Main cleanup script
- `final_phase3_verification.sh` - Phase 3 verification
- `final_verification.sh` - Final verification
- `fix_hardcoded_values.sh` - Fix hardcoded values
- `fix_remaining.sh` - Fix remaining issues
- `run_fix_search_preferences_functions.sh` - Fix search preferences
- `run_migration_with_psql.sh` - Run migrations with psql
- `run_phase3_validation.sh` - Phase 3 validation
- `verify_migration_fixed.sh` - Verify migration fixes
- `verify_migration.sh` - Verify migrations

## Usage Examples

### Debug RLS Policies
```bash
# Check if RLS policies are working
node scripts/debug/check_rls_policies.js

# Apply RLS fixes
node scripts/debug/fix_rls_policies.js
```

### Test Cart System
```bash
# Test cart insertion
node scripts/testing/test_cart_insert.js

# Test cart merge
node scripts/testing/test_cart_merge_system.js

# Test complete flow
node scripts/testing/test_complete_cart_flow.js
```

### Run Shell Scripts
```bash
# Run cleanup script
./scripts/dynable_cleanup.sh

# Run verification
./scripts/final_verification.sh

# Fix remaining issues
./scripts/fix_remaining.sh
```

## Cleanup Status

### ✅ Completed Cleanup
- **Removed outdated scripts** - Deleted 12+ outdated test scripts
- **Organized by category** - Debug, testing, migrations, shell scripts
- **Updated documentation** - Current and accurate script descriptions
- **Maintained functionality** - All essential scripts preserved

### 📊 Script Inventory
- **Debug Scripts:** 3 files
- **Test Scripts:** 6 files  
- **Migration Scripts:** Variable (as needed)
- **Shell Scripts:** 68 files
- **Total:** 77+ organized scripts

## Maintenance

### Adding New Scripts
1. **Place in appropriate category** (debug, testing, migrations)
2. **Update this README** with script description and usage
3. **Follow naming conventions** (descriptive names)
4. **Include error handling** and logging

### Script Standards
- **Descriptive names** - Clear purpose from filename
- **Error handling** - Comprehensive error handling
- **Logging** - Appropriate logging for debugging
- **Documentation** - Clear usage instructions

## Notes

- All scripts have been tested and verified as part of the cleanup
- Outdated and duplicate scripts have been removed
- Scripts are organized for easy maintenance and execution
- Follow established patterns when adding new scripts

---

**Status:** ✅ CLEAN AND ORGANIZED - Ready for production use 