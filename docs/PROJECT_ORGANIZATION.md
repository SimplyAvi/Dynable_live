# 🗂️ Dynable Project Organization

This document outlines the organized structure of the Dynable project after the RBAC implementation.

## 📁 **Root Directory Structure**

```
dynable_new/
├── 📁 docs/                    # Project documentation
│   ├── 📁 deployment/          # Deployment guides and checklists
│   ├── 📁 guides/             # Implementation and integration guides
│   ├── 📁 migrations/         # Database migration documentation
│   └── README.md              # Main project README
├── 📁 database/               # Database-related files
│   ├── 📁 migrations/         # SQL migration files
│   ├── 📁 scripts/           # Database utility scripts
│   └── 📁 backups/           # Database backup files
├── 📁 scripts/               # Utility scripts
│   ├── 📁 rbac/             # RBAC-specific scripts
│   ├── 📁 testing/          # Test scripts
│   └── 📁 utilities/        # General utility scripts
├── 📁 data/                 # Data files
│   ├── 📁 exports/          # JSON exports and mappings
│   ├── 📁 analysis/         # Analysis files and logs
│   └── 📁 mappings/         # Product mapping data
├── 📁 server/               # Backend server
│   ├── 📁 api/              # API routes
│   ├── 📁 middleware/       # Express middleware
│   ├── 📁 utils/            # Utility functions
│   ├── 📁 db/               # Database models and config
│   ├── 📁 docs/             # Server documentation
│   ├── 📁 tests/            # Server test files
│   ├── 📁 scripts/          # Server utility scripts
│   └── server.js            # Main server file
├── 📁 src/                  # Frontend React application
├── 📁 public/               # Static assets
├── 📁 cypress/              # E2E testing
└── 📁 scripts/              # Root-level scripts
```

## 📋 **File Categories**

### **📁 docs/ - Documentation**
- **deployment/**: Deployment guides, checklists, and setup instructions
- **guides/**: Implementation guides, integration docs, and technical guides
- **migrations/**: Database migration documentation
- **README.md**: Main project documentation

### **📁 database/ - Database Files**
- **migrations/**: SQL migration files (phase1, phase2, etc.)
- **scripts/**: Database utility scripts
- **backups/**: Database backup files (.dump files)

### **📁 scripts/ - Utility Scripts**
- **rbac/**: RBAC-specific scripts (setup, verification, admin creation)
- **testing/**: Test scripts for various components
- **utilities/**: General utility scripts and shell scripts

### **📁 data/ - Data Files**
- **exports/**: JSON exports, product mappings, analysis results
- **analysis/**: Log files, CSV exports, analysis reports
- **mappings/**: Product mapping data and configurations

### **📁 server/ - Backend**
- **api/**: Express API routes (auth, seller, recipe, etc.)
- **middleware/**: Express middleware (roleAuth, etc.)
- **utils/**: Utility functions (JWT, identity linking)
- **db/**: Database models and configuration
- **docs/**: Server-specific documentation
- **tests/**: Server test files
- **scripts/**: Server utility scripts

## 🔧 **Key Files by Category**

### **RBAC Implementation Files**
```
scripts/rbac/
├── test_env_setup.js         # Environment configuration test
├── create_first_admin.js     # Admin user creation
├── verify_rbac_setup.js      # RBAC system verification
└── update_env.js            # Environment setup helper

server/
├── api/authRoutes.js         # Authentication routes with RBAC
├── api/sellerRoutes.js       # Seller-specific routes
├── middleware/roleAuth.js    # Role-based middleware
├── utils/jwt.js             # JWT utilities with roles
└── utils/identityLinking.js # Anonymous user linking
```

### **Database Migrations**
```
database/migrations/
├── phase1_database_migration.sql      # RBAC schema setup
├── phase2_supabase_rls_policies.sql  # RLS policies
├── verify_migrations.sql              # Migration verification
└── [other SQL files]                 # Additional migrations
```

### **Documentation**
```
docs/deployment/
├── DEPLOYMENT_CHECKLIST.md           # Deployment steps
├── ENVIRONMENT_SETUP.md              # Environment configuration
├── FINAL_DEPLOYMENT_SUMMARY.md       # Deployment summary
├── FIRST_USER_SETUP.md               # Admin user setup
├── MIGRATION_GUIDE.md                # Database migration guide
├── QUICK_START_DEPLOYMENT.md         # Quick start guide
└── RBAC_DEPLOYMENT_GUIDE.md          # RBAC deployment guide

docs/guides/
├── AUTHENTICATION_IMPACT_ANALYSIS.md # Auth system analysis
├── FRONTEND_INTEGRATION_GUIDE.md     # Frontend integration
├── IMPLEMENTATION_CHECKLIST.md       # Implementation steps
├── RBAC_IMPLEMENTATION_GUIDE.md      # RBAC implementation
├── RBAC_IMPLEMENTATION_SUMMARY.md    # Implementation summary
├── RBAC_TESTING_PLAN.md              # Testing strategy
├── ROUTING_EXAMPLE.md                # Route protection examples
└── SUPABASE_KEYS_GUIDE.md            # Supabase setup guide
```

## 🚀 **Quick Access Commands**

### **Environment Setup**
```bash
# Test environment configuration
node scripts/rbac/test_env_setup.js

# Create first admin user
node scripts/rbac/create_first_admin.js

# Verify RBAC setup
node scripts/rbac/verify_rbac_setup.js
```

### **Database Operations**
```bash
# Run migrations
psql -d your_db_url -f database/migrations/phase1_database_migration.sql
psql -d your_db_url -f database/migrations/phase2_supabase_rls_policies.sql

# Check migration status
psql -d your_db_url -f database/migrations/verify_migrations.sql
```

### **Development**
```bash
# Start the application
npm run dev

# Run tests
node scripts/testing/test_*.js

# Run utilities
node scripts/utilities/[script_name].js
```

## 📖 **Documentation Navigation**

### **Getting Started**
1. **docs/README.md** - Main project overview
2. **docs/deployment/QUICK_START_DEPLOYMENT.md** - Quick setup
3. **docs/guides/RBAC_IMPLEMENTATION_GUIDE.md** - RBAC overview

### **Deployment**
1. **docs/deployment/DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment
2. **docs/deployment/ENVIRONMENT_SETUP.md** - Environment configuration
3. **docs/deployment/FIRST_USER_SETUP.md** - Admin user creation

### **Development**
1. **docs/guides/FRONTEND_INTEGRATION_GUIDE.md** - Frontend integration
2. **docs/guides/ROUTING_EXAMPLE.md** - Route protection examples
3. **docs/guides/RBAC_TESTING_PLAN.md** - Testing strategy

## 🔍 **File Search Tips**

### **Find RBAC Files**
```bash
find . -name "*rbac*" -o -name "*RBAC*"
```

### **Find Test Files**
```bash
find . -name "test_*.js"
```

### **Find Documentation**
```bash
find docs/ -name "*.md"
```

### **Find Database Files**
```bash
find database/ -name "*.sql"
```

## 📝 **Maintenance Notes**

- **New RBAC features** should be added to `server/api/` and `server/middleware/`
- **New tests** should go in `scripts/testing/` or `server/tests/`
- **New documentation** should be organized in `docs/` by category
- **Database changes** should be added to `database/migrations/`
- **Utility scripts** should be placed in appropriate `scripts/` subdirectories

This organization makes the project more maintainable and easier to navigate for both current and future developers. 