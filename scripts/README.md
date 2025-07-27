# Scripts

**Author:** Justin Linzan  
**Date:** January 2025  
**Status:** ✅ ACTIVE

## Overview

This directory contains utility scripts for debugging, testing, and database operations. All scripts are organized by purpose for easy maintenance and execution.

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
└── testing/                           # Test scripts
    ├── test_cart_insert.js
    ├── test_cart_merge_system.js
    ├── test_complete_cart_flow.js
    ├── test_rls_carts.js
    ├── test_simple_cart_merge.js
    └── test_specific_cart.js
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

### Debug Cart Issues
```bash
# Debug cart merge problems
node scripts/debug/debug_cart_merge.js

# Test specific cart functionality
node scripts/testing/test_specific_cart.js
```

## Script Requirements

### Environment Variables
Most scripts require these environment variables:
```bash
SUPABASE_DB_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
JWT_SECRET=...
```

### Dependencies
Scripts may require these packages:
```bash
npm install pg dotenv
```

## Script Standards

### Error Handling
All scripts include:
- Try-catch blocks
- Detailed error messages
- Graceful failure handling

### Logging
Scripts use consistent logging:
```javascript
console.log('[SCRIPT] Starting...');
console.error('[SCRIPT] Error:', error);
console.log('[SCRIPT] Completed successfully');
```

### Configuration
Scripts support:
- Environment variable configuration
- Command line arguments
- Configurable timeouts

## Maintenance

### Adding New Scripts
1. **Debug scripts** → Place in `scripts/debug/`
2. **Test scripts** → Place in `scripts/testing/`
3. **Migration scripts** → Place in `scripts/migrations/`

### Script Naming Convention
- **Debug**: `debug_purpose.js`
- **Test**: `test_functionality.js`
- **Migration**: `migrate_action.js`

### Documentation Standards
- Include purpose and usage
- Document required environment variables
- Provide example outputs
- Include error handling notes

## Troubleshooting

### Common Issues
1. **Database Connection** - Check `SUPABASE_DB_URL`
2. **Authentication** - Verify JWT tokens
3. **Permissions** - Ensure proper RLS policies
4. **Dependencies** - Install required packages

### Debug Steps
1. Check environment variables
2. Verify database connection
3. Test individual functions
4. Review error logs

---

**Status:** ✅ **ACTIVE**  
**Last Updated:** January 2025  
**Maintainer:** Justin Linzan 