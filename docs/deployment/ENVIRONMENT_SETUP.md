# 🔧 Environment Variables Setup Guide

**Author:** Justin Linzan  
**Date:** June 2025  

---

## 📋 **COMPLETE .env FILE SETUP**

Create or update your `.env` file in the **project root** (not in `/server`):

```bash
# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
SUPABASE_DB_URL=postgresql://postgres:JustinAndAvi123!@db.fdojimqdhuqhimgjpdai.supabase.co:6543/postgres
NODE_ENV=development

# =============================================================================
# JWT SECURITY (REQUIRED FOR RBAC)
# =============================================================================
# Generate a secure random string for JWT_SECRET
JWT_SECRET=your_very_secure_jwt_secret_key_here_minimum_32_characters
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# =============================================================================
# SUPABASE CONFIGURATION (REQUIRED FOR IDENTITY LINKING)
# =============================================================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_IDENTITY_LINKING_ENABLED=true

# =============================================================================
# GOOGLE OAUTH (EXISTING)
# =============================================================================
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 🔑 **HOW TO GET SUPABASE KEYS**

### **Step 1: Access Your Supabase Project**
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your Dynable project

### **Step 2: Get Project URL**
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the **Project URL** (looks like: `https://fdojimqdhuqhimgjpdai.supabase.co`)
3. Set this as `SUPABASE_URL`

### **Step 3: Get API Keys**
1. In the same **Settings** → **API** page
2. Copy the **anon public** key (starts with `eyJ...`)
3. Set this as `SUPABASE_ANON_KEY`
4. Copy the **service_role secret** key (starts with `eyJ...`)
5. Set this as `SUPABASE_SERVICE_ROLE_KEY`

### **Step 4: Get JWT Secret**
1. Go to **Settings** → **JWT Settings**
2. Copy the **JWT Secret** (long string)
3. Set this as `SUPABASE_JWT_SECRET`

---

## 🔐 **GENERATE JWT_SECRET**

For the `JWT_SECRET`, generate a secure random string:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

**Example JWT_SECRET:**
```
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

## ✅ **VERIFICATION CHECKLIST**

### **Required Variables:**
- [ ] `SUPABASE_DB_URL` - Your existing database URL
- [ ] `JWT_SECRET` - Generated secure random string (32+ chars)
- [ ] `SUPABASE_JWT_SECRET` - From Supabase JWT Settings
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - From Supabase API Settings
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase API Settings
- [ ] `REACT_APP_GOOGLE_CLIENT_ID` - Your existing Google OAuth ID

### **Optional Variables:**
- [ ] `SUPABASE_IDENTITY_LINKING_ENABLED=true` - Enable identity linking
- [ ] `NODE_ENV=development` - Set to production for live deployment

---

## 🧪 **TEST ENVIRONMENT VARIABLES**

Create a test script to verify your environment variables:

```bash
# Create test script
cat > test_env.js << 'EOF'
console.log('🔧 Testing Environment Variables...\n');

const required = [
  'SUPABASE_DB_URL',
  'JWT_SECRET',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'REACT_APP_GOOGLE_CLIENT_ID'
];

const optional = [
  'SUPABASE_IDENTITY_LINKING_ENABLED',
  'NODE_ENV'
];

console.log('✅ Required Variables:');
required.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ❌ ${varName}: MISSING`);
  }
});

console.log('\n📋 Optional Variables:');
optional.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (optional)`);
  }
});

console.log('\n🎯 Environment Setup Complete!');
EOF

# Run the test
node test_env.js
```

---

## 🚨 **COMMON ISSUES & SOLUTIONS**

### **Issue 1: "supabaseUrl is required"**
**Solution:** Set `SUPABASE_URL` in your `.env` file

### **Issue 2: "JWT_SECRET must have a value"**
**Solution:** Generate and set `JWT_SECRET` in your `.env` file

### **Issue 3: "Cannot find module '@supabase/supabase-js'"**
**Solution:** Run `cd server && npm install @supabase/supabase-js`

### **Issue 4: Environment variables not loading**
**Solution:** Ensure `.env` file is in the **project root** (not in `/server`)

---

## 🔄 **NEXT STEPS**

After setting up environment variables:

1. **Test the server:** `cd server && npm run dev`
2. **Run database migrations:** See `QUICK_START_DEPLOYMENT.md`
3. **Test authentication:** Login with different user roles
4. **Verify RBAC features:** Test admin, seller, and user functions

---

**🎉 Once environment variables are set, your RBAC system will be ready to deploy!** 