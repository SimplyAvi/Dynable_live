# 🚀 Dynable RBAC Deployment Guide

**Author:** Justin Linzan  
**Date:** July 2025  
**Version:** 2.0 (Consolidated)

---

## 📋 **Table of Contents**

1. [Quick Start](#-quick-start)
2. [Environment Setup](#-environment-setup)
3. [Database Migrations](#-database-migrations)
4. [First Admin User](#-first-admin-user)
5. [Testing Strategy](#-testing-strategy)
6. [Troubleshooting](#-troubleshooting)

---

## ⚡ **Quick Start**

### **Prerequisites**
- Node.js 16+ installed
- Access to Supabase project
- Git repository cloned

### **1. Install Dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install Supabase client (if not already installed)
npm install @supabase/supabase-js
```

### **2. Set Environment Variables**
Create `.env` file in project root:

```bash
# =============================================================================
# EXISTING CONFIGURATION (KEEP THESE)
# =============================================================================
NODE_ENV=development
SUPABASE_DB_URL=postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres

# =============================================================================
# NEW RBAC VARIABLES (ADD THESE)
# =============================================================================
JWT_SECRET=your_very_secure_jwt_secret_key_here
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_IDENTITY_LINKING_ENABLED=true
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### **3. Run Database Migrations**
```bash
# Navigate to project root
cd ..

# Run Phase 1: Database schema updates
psql $SUPABASE_DB_URL -f database/migrations/phase1_database_migration.sql

# Run Phase 2: RLS policies
psql $SUPABASE_DB_URL -f database/migrations/phase2_supabase_rls_policies.sql
```

### **4. Start the Application**
```bash
# Start backend server
cd server && npm run dev

# In new terminal, start frontend
cd .. && npm start
```

### **5. Create First Admin User**
```bash
# Run admin creation script
node scripts/rbac/create_first_admin.js
```

---

## 🔧 **Environment Setup**

### **Generate JWT Secret**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Get Supabase Keys**
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in and select your Dynable project
3. Navigate to **Settings** → **API**
4. Copy **Project URL** (e.g., `https://fdojimqdhuqhimgjpdai.supabase.co`)
5. Copy **anon public** key (starts with `eyJ...`)
6. Copy **service_role secret** key (starts with `eyJ...`)
7. Navigate to **Settings** → **JWT Settings**
8. Copy **JWT Secret** (long string)

### **Test Environment Configuration**
```bash
# Test all environment variables
node scripts/rbac/test_env_setup.js
```

---

## 🗄️ **Database Migrations**

### **Phase 1: Database Schema Updates**
```bash
# Run Phase 1 migration
psql $SUPABASE_DB_URL -f database/migrations/phase1_database_migration.sql
```

**What this does:**
- Creates `user_role` ENUM type
- Adds role fields to Users table
- Adds seller-specific fields
- Creates admin_actions table
- Sets up indexes for performance

### **Phase 2: Supabase RLS Policies**
```bash
# Run Phase 2 migration
psql $SUPABASE_DB_URL -f database/migrations/phase2_supabase_rls_policies.sql
```

**What this does:**
- Enables Row Level Security on all tables
- Creates role-based access policies
- Sets up anonymous user policies
- Configures product ownership rules

### **Verify Migrations**
```bash
# Check migration status
psql $SUPABASE_DB_URL -f database/migrations/verify_migrations.sql
```

---

## 👑 **First Admin User**

### **Option A: Using Script (Recommended)**
```bash
# Run the admin creation script
node scripts/rbac/create_first_admin.js
```

### **Option B: Manual Database Insert**
```sql
INSERT INTO "Users" (email, name, role, "createdAt", "updatedAt")
VALUES ('admin@dynable.com', 'System Administrator', 'admin', NOW(), NOW());
```

### **Option C: Via API**
1. Create user via signup API
2. Update role to admin in database:
```sql
UPDATE "Users" SET role = 'admin' WHERE email = 'admin@dynable.com';
```

---

## 🧪 **Testing Strategy**

### **Backend Tests**
```bash
# Test environment setup
node scripts/rbac/test_env_setup.js

# Verify RBAC setup
node scripts/rbac/verify_rbac_setup.js

# Test API endpoints
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Frontend Tests**
- [ ] Login page loads correctly
- [ ] Google OAuth works
- [ ] Profile shows role information
- [ ] Route protection works
- [ ] Admin controls visible for admin users
- [ ] Seller dashboard visible for seller users

### **Role-Based Feature Tests**
- [ ] Admin users can access admin endpoints
- [ ] Seller users can manage their products
- [ ] End users see appropriate options
- [ ] Unauthorized access is blocked
- [ ] Anonymous users can browse but not purchase

---

## 🔧 **Troubleshooting**

### **Server Won't Start**
```bash
# Check if Supabase is installed
cd server && npm list @supabase/supabase-js

# If missing, install it
npm install @supabase/supabase-js

# Check environment variables
node scripts/rbac/test_env_setup.js
```

### **Database Migration Errors**
```bash
# Check table names
psql $SUPABASE_DB_URL -c "\dt"

# Verify connection
psql $SUPABASE_DB_URL -c "SELECT version();"

# Check if user_role enum exists
psql $SUPABASE_DB_URL -c "SELECT typname FROM pg_type WHERE typname = 'user_role';"
```

### **Authentication Issues**
```bash
# Test JWT generation
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({id: 1, role: 'admin'}, process.env.JWT_SECRET);
console.log('Token:', token);
"

# Check token verification
node scripts/rbac/verify_rbac_setup.js
```

### **Common Issues**

#### **"Module not found" errors**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **"Permission denied" errors**
```bash
# Check file permissions
chmod +x scripts/rbac/*.js
chmod +x scripts/testing/*.js
```

#### **"Connection refused" errors**
```bash
# Check if server is running
lsof -i :5001

# Restart server
cd server && npm run dev
```

---

## 📊 **Verification Checklist**

### **Environment**
- [ ] All environment variables set
- [ ] JWT secret generated
- [ ] Supabase keys configured
- [ ] Environment test passes

### **Database**
- [ ] Phase 1 migration completed
- [ ] Phase 2 migration completed
- [ ] RLS policies active
- [ ] User roles working

### **Backend**
- [ ] Server starts without errors
- [ ] Database connection works
- [ ] Auth routes respond
- [ ] Role-based endpoints work

### **Frontend**
- [ ] Login page loads
- [ ] OAuth integration works
- [ ] Role-based UI displays
- [ ] Route protection active

### **RBAC System**
- [ ] Admin user created
- [ ] Role assignment works
- [ ] Permission checks pass
- [ ] Anonymous user handling works

---

## 🎯 **Next Steps**

After successful deployment:

1. **Test all user roles** - Admin, Seller, End User
2. **Verify anonymous user flow** - Browse → Sign up → Cart transfer
3. **Check seller features** - Product management, inventory
4. **Test admin functions** - User management, system oversight
5. **Monitor logs** - Check for any errors or issues

---

## 📞 **Support**

For issues or questions:
- Check the troubleshooting section above
- Review server logs for error messages
- Verify environment variables are correct
- Test database connection separately

**The RBAC system is now ready for production use!** 🚀 