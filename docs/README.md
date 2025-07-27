# Documentation

**Author:** Justin Linzan  
**Date:** January 2025  
**Status:** ✅ ACTIVE

## Overview

This directory contains comprehensive documentation for the Dynable project, organized by category for easy navigation and maintenance.

## Directory Structure

```
docs/
├── README.md                           # This file
├── guides/                             # User guides and tutorials
│   ├── ANONYMOUS_AUTH_DEPLOYMENT.md
│   ├── ANONYMOUS_USER_FLOW_GUIDE.md
│   ├── ANONYMOUS_USER_TRACKING.md
│   ├── AUTHENTICATION_FLOW.md
│   ├── CART_MANAGEMENT_FUNCTIONS.md
│   ├── CART_MERGE_SYSTEM_FIXES.md
│   ├── CART_SYSTEM_FIXES_SUMMARY.md
│   ├── CART_SYSTEM_SCHEMA.md
│   ├── DATABASE_PERSISTENCE.md
│   ├── FRONTEND_TO_SUPABASE_CONNECTION_ANALYSIS.md
│   ├── PURE_SUPABASE_TESTING_GUIDE.md
│   ├── REDUX_STORE_STRUCTURE.md
│   ├── RLS_POLICIES.md
│   ├── SESSION_STATE_HANDLING.md
│   ├── SUPABASE_AUTH_NEW_INTERFACE.md
│   ├── SUPABASE_AUTH_SETUP_COMPLETE.md
│   ├── SUPABASE_AUTH_SETUP_SPECIFIC.md
│   ├── SUPABASE_CORS_SETUP.md
│   ├── SUPABASE_MIGRATION_COMPLETE.md
│   ├── SUPABASE_MIGRATION_TEST_PLAN.md
│   └── SUPABASE_OAUTH_SETUP.md
├── migrations/                         # Database migration files
│   ├── anonymous_auth_setup.sql
│   ├── check_cart_table_schema.sql
│   ├── check_exact_table_name.sql
│   ├── check_ingredient_columns.sql
│   ├── check_ingredient_table_structure.sql
│   ├── check_orders_required_columns.sql
│   ├── check_orders_rls_policies.sql
│   ├── check_orders_table_structure.sql
│   ├── check_recipe_structure.sql
│   ├── check_recipe_tables.sql
│   ├── check_recipes_columns.sql
│   ├── fix_carts_rls_policies.sql
│   ├── fix_carts_table_constraints.sql
│   ├── fix_orders_rls_policies.sql
│   ├── fix_orders_rls_policies_uuid_only.sql
│   ├── fix_orders_table_constraints.sql
│   ├── fix_orders_table_uuid.sql
│   ├── fix_orders_table_uuid_corrected.sql
│   ├── fix_rls_policies_for_email_queries.sql
│   ├── fix_rls_policies_v2.sql
│   ├── fix_users_table_uuid.sql
│   ├── fix_users_table_uuid_fixed.sql
│   ├── optimize_ingredient_query.sql
│   ├── optimize_ingredient_query_corrected.sql
│   ├── optimize_ingredient_query_final.sql
│   ├── optimize_ingredient_query_fixed.sql
│   ├── prevent_duplicate_carts.sql
│   ├── secure_rls_policies.sql
│   └── secure_rls_policies_fixed.sql
└── debug/                              # Debug documentation
    └── [debug-specific docs]
```

## Quick Navigation

### 📚 User Guides
- **[Authentication Flow](guides/AUTHENTICATION_FLOW.md)** - Complete auth system guide
- **[Cart Management](guides/CART_MANAGEMENT_FUNCTIONS.md)** - Cart system documentation
- **[Anonymous Auth](guides/ANONYMOUS_AUTH_DEPLOYMENT.md)** - Anonymous user setup
- **[Supabase Setup](guides/SUPABASE_AUTH_SETUP_COMPLETE.md)** - Supabase configuration

### 🔧 Database Migrations
- **[Migration Files](migrations/)** - All SQL migration files
- **[Schema Checks](migrations/check_*.sql)** - Database structure verification
- **[RLS Policies](migrations/fix_rls_*.sql)** - Row Level Security fixes
- **[Table Constraints](migrations/fix_*_constraints.sql)** - Table constraint fixes

### 🛠️ System Documentation
- **[Redux Store](guides/REDUX_STORE_STRUCTURE.md)** - State management
- **[Session Handling](guides/SESSION_STATE_HANDLING.md)** - Session management
- **[Database Persistence](guides/DATABASE_PERSISTENCE.md)** - Data persistence
- **[RLS Policies](guides/RLS_POLICIES.md)** - Security policies

## Documentation Categories

### Authentication & Authorization
- Anonymous user authentication
- Google OAuth setup
- Session management
- RLS policy configuration

### Cart System
- Cart management functions
- Anonymous cart handling
- Cart merge operations
- Cart data persistence

### Database & Migrations
- Table structure verification
- RLS policy fixes
- Constraint management
- Query optimization

### Frontend Integration
- Redux store structure
- Supabase connection
- State management
- Component architecture

## Maintenance

### Adding New Documentation
1. **Guides** → Place in `docs/guides/`
2. **Migrations** → Place in `docs/migrations/`
3. **Debug Docs** → Place in `docs/debug/`

### File Naming Convention
- **Guides**: `DESCRIPTIVE_NAME.md`
- **Migrations**: `action_table_name.sql`
- **Debug**: `debug_purpose.md`

### Documentation Standards
- Include author and date
- Use clear headings
- Include code examples
- Provide usage instructions

---

**Status:** ✅ **ACTIVE**  
**Last Updated:** January 2025  
**Maintainer:** Justin Linzan
