/**
 * Comprehensive Diagnostic Tool
 * 
 * This script runs all diagnostic tools in sequence to provide
 * a complete analysis of SimplyAvi's setup issues.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const runComprehensiveDiagnostics = async () => {
  console.log('🔍 COMPREHENSIVE DIAGNOSTIC TOOL\n');
  console.log('Running all diagnostic tests to identify SimplyAvi\'s issues...\n');
  console.log('=' .repeat(80));
  console.log('');

  try {
    // Step 1: Server Startup Diagnostics
    console.log('📋 STEP 1: SERVER STARTUP DIAGNOSTICS');
    console.log('=' .repeat(50));
    await runDiagnostic('debug_server_startup.js');
    console.log('');

    // Step 2: Environment Variable Diagnostics
    console.log('📋 STEP 2: ENVIRONMENT VARIABLE DIAGNOSTICS');
    console.log('=' .repeat(50));
    await runDiagnostic('debug_environment.js');
    console.log('');

    // Step 3: Backend Connection Diagnostics
    console.log('📋 STEP 3: BACKEND CONNECTION DIAGNOSTICS');
    console.log('=' .repeat(50));
    await runDiagnostic('debug_backend_connection.js');
    console.log('');

    // Step 4: Database Access Diagnostics
    console.log('📋 STEP 4: DATABASE ACCESS DIAGNOSTICS');
    console.log('=' .repeat(50));
    await runDiagnostic('debug_database_access.js');
    console.log('');

    // Step 5: API Endpoint Diagnostics
    console.log('📋 STEP 5: API ENDPOINT DIAGNOSTICS');
    console.log('=' .repeat(50));
    await runDiagnostic('debug_api_endpoints.js');
    console.log('');

    // Final Summary
    console.log('🎯 COMPREHENSIVE DIAGNOSTIC SUMMARY');
    console.log('=' .repeat(50));
    console.log('');
    console.log('Based on the diagnostic results above, here are the most likely issues:');
    console.log('');
    console.log('🔍 COMMON ROOT CAUSES:');
    console.log('1. Backend server not running on port 5001');
    console.log('2. Missing or incorrect environment variables');
    console.log('3. Database connection issues');
    console.log('4. RLS policy configuration problems');
    console.log('5. Network connectivity issues');
    console.log('');
    console.log('💡 RECOMMENDED TROUBLESHOOTING STEPS:');
    console.log('1. Start the backend server: cd server && npm run dev');
    console.log('2. Check environment variables in .env files');
    console.log('3. Verify database connectivity');
    console.log('4. Test API endpoints directly');
    console.log('5. Check browser console for frontend errors');
    console.log('');
    console.log('🚀 QUICK FIX COMMANDS:');
    console.log('cd /Users/justinlinzan/dynable_new');
    console.log('cd server && npm run dev  # Start backend');
    console.log('# In new terminal:');
    console.log('npm start  # Start frontend');
    console.log('');

  } catch (error) {
    console.error('❌ Comprehensive diagnostic failed:', error.message);
  }
};

async function runDiagnostic(scriptName) {
  try {
    const scriptPath = `scripts/debug/${scriptName}`;
    console.log(`Running ${scriptName}...`);
    console.log('');
    
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
      cwd: process.cwd(),
      timeout: 30000
    });
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.log('Warnings/Errors:', stderr);
    }
    
  } catch (error) {
    console.log(`❌ Failed to run ${scriptName}: ${error.message}`);
    console.log('');
  }
}

// Run the comprehensive diagnostic
runComprehensiveDiagnostics(); 