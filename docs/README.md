# 🚀 Dynable - Complete Setup Guide

**Author:** Justin Linzan  
**Date:** July 2025  
**Version:** 2.0 (RBAC Enhanced)

---

## 📋 **Project Overview**

Dynable is a robust ingredient/product mapping and recipe platform with a comprehensive Role-Based Access Control (RBAC) system. The platform supports multiple user types with secure authentication and authorization.

### **Key Features**
- **Multi-role authentication** (Admin, Seller, End User, Anonymous)
- **Supabase integration** with Row Level Security (RLS)
- **Google OAuth** with role-based token generation
- **Anonymous user support** with cart persistence
- **Seller verification system** with admin oversight
- **Product management** with inventory tracking

---

## 🏗️ **System Architecture**

### **User Roles & Permissions**

| Role | Description | Key Features |
|------|-------------|--------------|
| **Admin** | System administrator | User management, system oversight, seller verification |
| **Seller** | Product sellers | Product management, inventory, sales analytics |
| **End User** | Regular customers | Browse products, place orders, manage profile |
| **Anonymous** | Unauthenticated users | Browse products, add to cart (localStorage) |

### **Technology Stack**

- **Frontend:** React, Redux Toolkit, React Router
- **Backend:** Express.js, Sequelize ORM
- **Database:** PostgreSQL with Supabase
- **Authentication:** JWT tokens, Google OAuth
- **Security:** Supabase RLS policies, role-based middleware

---

## 🛠️ **Quick Start**

### **1. Clone and Install**
```bash
git clone <your-repo-url>
cd dynable_new
npm install
cd server && npm install
```

### **2. Environment Setup**
Create `.env` file in project root:

```bash
# =============================================================================
# EXISTING CONFIGURATION
# =============================================================================
NODE_ENV=development
SUPABASE_DB_URL=postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres

# =============================================================================
# RBAC SYSTEM VARIABLES
# =============================================================================
JWT_SECRET=your_very_secure_jwt_secret_key_here
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_IDENTITY_LINKING_ENABLED=true
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### **3. Database Setup**
```bash
# Run RBAC migrations
psql $SUPABASE_DB_URL -f database/migrations/phase1_database_migration.sql
psql $SUPABASE_DB_URL -f database/migrations/phase2_supabase_rls_policies.sql
```

### **4. Start Application**
```bash
# Start backend
cd server && npm run dev

# Start frontend (new terminal)
cd .. && npm start
```

### **5. Create Admin User**
```bash
node scripts/rbac/create_first_admin.js
```

---

## 🗄️ **Database Schema**

### **Core Tables**

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **Users** | User accounts | Role-based authentication, seller info |
| **IngredientCategorized** | Products | Seller ownership, inventory tracking |
| **RecipeIngredients** | Recipe components | Ingredient mapping |
| **Ingredients** | Canonical ingredients | Master ingredient list |
| **Carts** | Shopping carts | User-specific cart management |
| **Orders** | Purchase orders | Order tracking and history |

### **RBAC Extensions**

- **User roles** (`admin`, `seller`, `end_user`)
- **Seller verification** (`is_verified_seller`)
- **Anonymous user tracking** (`converted_from_anonymous`)
- **Admin audit trail** (`admin_actions` table)

---

## 🧩 **Key Scripts**

### **RBAC Management**
```bash
# Test environment configuration
node scripts/rbac/test_env_setup.js

# Create admin user
node scripts/rbac/create_first_admin.js

# Verify RBAC setup
node scripts/rbac/verify_rbac_setup.js
```

### **Data Processing**
```bash
# Ingredient analysis
node server/scripts/analyzeIngredientProminence.js

# Product mapping
node server/scripts/batch_retag_products.js

# Generate reports
node server/scripts/generateProminenceReport.js
```

---

## 🧪 **API Endpoints**

### **Authentication**
- `POST /api/auth/login` - User login with role assignment
- `POST /api/auth/signup` - User registration with anonymous cart transfer
- `GET /api/auth/profile` - User profile with role information
- `POST /api/auth/apply-seller` - Seller application

### **Role-Based Endpoints**
- `GET /api/admin/users` - Admin: View all users
- `PUT /api/admin/users/:id/role` - Admin: Change user role
- `GET /api/seller/dashboard` - Seller: Dashboard
- `GET /api/seller/products` - Seller: Manage products

### **Product Management**
- `GET /api/product/search` - Search products
- `POST /api/product/by-ingredient` - Find products by ingredient
- `GET /api/recipe` - Recipe endpoints

---

## 📁 **Project Structure**

```
dynable_new/
├── 📁 docs/                    # Documentation
│   ├── 📁 deployment/          # Deployment guides
│   ├── 📁 guides/             # Implementation guides
│   └── 📁 migrations/         # Database documentation
├── 📁 database/               # Database files
│   ├── 📁 migrations/         # SQL migrations
│   ├── 📁 backups/           # Database backups
│   └── 📁 scripts/           # Database utilities
├── 📁 scripts/               # Utility scripts
│   ├── 📁 rbac/             # RBAC-specific scripts
│   ├── 📁 testing/          # Test scripts
│   └── 📁 utilities/        # General utilities
├── 📁 server/               # Backend
│   ├── 📁 api/              # API routes
│   ├── 📁 middleware/       # Express middleware
│   ├── 📁 utils/            # Utility functions
│   └── 📁 db/               # Database models
├── 📁 src/                  # Frontend React app
└── 📁 data/                 # Data exports and analysis
```

---

## 🔐 **Security Features**

### **Authentication**
- **JWT tokens** with role claims
- **Google OAuth** integration
- **Anonymous user support** with identity linking
- **Token refresh** mechanism

### **Authorization**
- **Role-based middleware** for route protection
- **Supabase RLS policies** for database security
- **Permission-based access** control
- **Admin audit trail** for sensitive operations

### **Data Protection**
- **Row Level Security** on all tables
- **Role-based data access** policies
- **Anonymous user limitations** (browse only)
- **Seller product ownership** enforcement

---

## 🧪 **Testing**

### **Environment Testing**
```bash
# Test environment configuration
node scripts/rbac/test_env_setup.js

# Verify RBAC setup
node scripts/rbac/verify_rbac_setup.js
```

### **Database Testing**
```bash
# Verify migrations
psql $SUPABASE_DB_URL -f database/migrations/verify_migrations.sql
```

### **Frontend Testing**
```bash
# Run unit tests
npm test

# Run E2E tests
npm run cypress:run
```

---

## 📚 **Documentation**

### **Deployment**
- **[DEPLOYMENT_GUIDE.md](deployment/DEPLOYMENT_GUIDE.md)** - Complete deployment guide
- **[ENVIRONMENT_SETUP.md](deployment/ENVIRONMENT_SETUP.md)** - Environment configuration

### **Implementation**
- **[RBAC_GUIDE.md](guides/RBAC_GUIDE.md)** - RBAC implementation guide
- **[FRONTEND_INTEGRATION.md](guides/FRONTEND_INTEGRATION.md)** - Frontend integration
- **[TESTING_PLAN.md](guides/RBAC_TESTING_PLAN.md)** - Testing strategy

### **Database**
- **[MIGRATION_GUIDE.md](migrations/MIGRATION_GUIDE.md)** - Database migration guide

---

## 🚀 **Development Workflow**

### **Adding New Features**
1. **Database changes** → `database/migrations/`
2. **Backend features** → `server/api/` and `server/middleware/`
3. **Frontend components** → `src/components/`
4. **Tests** → `scripts/testing/` or `server/tests/`
5. **Documentation** → `docs/` by category

### **RBAC Extensions**
1. **New roles** → Update database schema and JWT utilities
2. **New permissions** → Add RLS policies and middleware
3. **New endpoints** → Add role-based route protection
4. **New UI** → Add role-specific components

---

## 🎯 **Production Checklist**

### **Environment**
- [ ] All environment variables configured
- [ ] JWT secrets generated and secure
- [ ] Supabase keys properly set
- [ ] Google OAuth configured

### **Database**
- [ ] RBAC migrations completed
- [ ] RLS policies active
- [ ] Admin user created
- [ ] Test data verified

### **Security**
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured
- [ ] Error logging implemented
- [ ] Admin audit trail active

### **Performance**
- [ ] Database indexes optimized
- [ ] JWT token expiration set
- [ ] Caching configured
- [ ] Monitoring in place

---

## 📞 **Support**

For issues or questions:
- Check the **[DEPLOYMENT_GUIDE.md](deployment/DEPLOYMENT_GUIDE.md)** for troubleshooting
- Review server logs for error messages
- Verify environment variables are correctly set
- Test database connection separately

**Dynable is production-ready with comprehensive RBAC security!** 🚀
