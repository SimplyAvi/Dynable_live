# Environment Setup Guide

## 🚀 **For New Team Members**

When someone clones your repository, they need to set up their environment to connect to your Supabase database.

## 📋 **Required Steps:**

### **1. Environment Variables**
Create a `.env` file in the project root with your Supabase credentials:

```bash
# Copy the example file
cp env.example .env

# Edit with your actual values
nano .env
```

**Required variables:**
```bash
SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres
NODE_ENV=development
JWT_SECRET=your_jwt_secret
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Verify Connection**
```bash
# Test database connection
node -e "
const db = require('./server/db/database');
db.query('SELECT current_database() as db_name', {type: require('sequelize').QueryTypes.SELECT})
.then(result => {
  console.log('✅ Connected to database:', result[0].db_name);
  process.exit(0);
}).catch(error => {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
});
"
```

## ⚠️ **Important Notes:**

### **Shared Database:**
- **Everyone connects to the same Supabase database**
- **Changes affect all team members**
- **Be careful with data modifications**
- **Use `--dry-run` flag for testing**

### **Environment Differences:**
- **Development:** `NODE_ENV=development`
- **Production:** `NODE_ENV=production`
- **Local testing:** Use `--dry-run` flag

### **Safe Testing:**
```bash
# Test scripts without making changes
node deploy_data_fixes.js --dry-run
node server/scripts/monitoring/automatedMonitoring.js
```

## 🔧 **Troubleshooting:**

### **Database Connection Issues:**
1. Check `SUPABASE_DB_URL` format
2. Verify credentials in Supabase dashboard
3. Check network connectivity

### **Permission Issues:**
1. Ensure you have access to the Supabase project
2. Check if your IP is whitelisted
3. Verify service role key permissions

### **Environment Variables:**
1. Make sure `.env` file exists in project root
2. Check for typos in variable names
3. Restart terminal after adding variables

## 📞 **Getting Help:**

If you encounter issues:
1. Check the logs for specific error messages
2. Verify your environment variables
3. Test database connection
4. Contact the team lead with specific error details

**Remember: This is a shared database, so be careful with any data modifications!** 