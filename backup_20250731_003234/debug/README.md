# Diagnostic Tools for SimplyAvi's Issues

This directory contains comprehensive diagnostic tools to identify and fix SimplyAvi's connection and functionality issues.

## 🔍 Available Diagnostic Tools

### 1. `debug_backend_connection.js`
Tests if the backend server is running and accessible on port 5001.

**What it checks:**
- Port 5001 availability
- Backend process status
- HTTP connection to backend
- API endpoint accessibility
- Port conflicts
- Network connectivity

### 2. `debug_environment.js`
Safely checks environment variable setup and configuration.

**What it checks:**
- .env file existence
- Required environment variables
- Variable type validation
- Database connection
- Supabase connection
- Configuration issues

### 3. `debug_database_access.js`
Tests direct database connectivity and RLS policies.

**What it checks:**
- Basic database connection
- Direct SQL queries
- RLS policy tests
- JWT token validation
- Allergen data verification
- Recipe data verification

### 4. `debug_api_endpoints.js`
Tests all API endpoints independently.

**What it checks:**
- Health check endpoint
- Allergen endpoints
- Product search endpoints
- Recipe endpoints
- Food endpoints
- Authentication endpoints

### 5. `debug_server_startup.js`
Guides proper server startup process and identifies startup issues.

**What it checks:**
- Project structure
- Running processes
- Package.json scripts
- Dependencies
- Environment files
- Server startup test

### 6. `run_comprehensive_diagnostics.js`
Runs all diagnostic tools in sequence for complete analysis.

## 🚀 How to Use

### Quick Start
```bash
# Navigate to server directory
cd server

# Run comprehensive diagnostics
node scripts/debug/run_comprehensive_diagnostics.js
```

### Individual Diagnostics
```bash
# Test backend connection
node scripts/debug/debug_backend_connection.js

# Check environment variables
node scripts/debug/debug_environment.js

# Test database access
node scripts/debug/debug_database_access.js

# Test API endpoints
node scripts/debug/debug_api_endpoints.js

# Check server startup
node scripts/debug/debug_server_startup.js
```

## 🎯 Common Issues and Solutions

### Issue: Backend server not running
**Symptoms:** ERR_CONNECTION_REFUSED to localhost:5001
**Solution:** 
```bash
cd server && npm run dev
```

### Issue: Missing environment variables
**Symptoms:** Database connection errors, API failures
**Solution:**
```bash
cp env.example .env
cd server && cp ../env.example .env
# Fill in required values in both .env files
```

### Issue: Database connection problems
**Symptoms:** RLS policy errors, data not loading
**Solution:** Check SUPABASE_DB_URL in .env files

### Issue: API endpoints failing
**Symptoms:** Frontend can't load data
**Solution:** Check backend server logs and route definitions

## 📊 Diagnostic Output

Each diagnostic tool provides:
- ✅ Success indicators
- ❌ Failure indicators
- Detailed error messages
- Specific recommendations
- Root cause identification

## 🔧 Troubleshooting Steps

1. **Run comprehensive diagnostics:**
   ```bash
   node scripts/debug/run_comprehensive_diagnostics.js
   ```

2. **Follow the recommendations** provided by each diagnostic

3. **Start services in correct order:**
   ```bash
   # Terminal 1: Start backend
   cd server && npm run dev
   
   # Terminal 2: Start frontend
   npm start
   ```

4. **Check browser console** for frontend errors

5. **Verify environment variables** are properly set

## 📝 Notes

- All diagnostics are safe and non-destructive
- They only read configuration and test connectivity
- No data is modified during diagnostics
- Timeout is set to 30 seconds for comprehensive diagnostics

## 🆘 Getting Help

If diagnostics don't resolve the issue:
1. Check the specific error messages from each diagnostic
2. Verify all environment variables are set correctly
3. Ensure both backend and frontend are running
4. Check browser console for additional errors 