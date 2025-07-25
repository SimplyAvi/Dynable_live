/**
 * Environment Variable Diagnostic Tool
 * 
 * This script safely checks SimplyAvi's environment variable setup
 * and compares it with expected values.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const fs = require('fs');
const path = require('path');

// Expected environment variables (without sensitive values)
const EXPECTED_VARS = {
  // Backend variables
  'NODE_ENV': 'string',
  'SUPABASE_DB_URL': 'string',
  'JWT_SECRET': 'string',
  'SUPABASE_JWT_SECRET': 'string',
  
  // Supabase variables
  'SUPABASE_URL': 'string',
  'SUPABASE_ANON_KEY': 'string',
  'SUPABASE_SERVICE_ROLE_KEY': 'string',
  'SUPABASE_IDENTITY_LINKING_ENABLED': 'boolean',
  
  // Google OAuth variables
  'GOOGLE_CLIENT_ID': 'string',
  'GOOGLE_CLIENT_SECRET': 'string',
  'REACT_APP_GOOGLE_CLIENT_ID': 'string',
  
  // Frontend variables
  'REACT_APP_API_URL': 'string',
  'REACT_APP_SUPABASE_URL': 'string',
  'REACT_APP_SUPABASE_ANON_KEY': 'string'
};

const debugEnvironment = async () => {
  console.log('🔍 ENVIRONMENT VARIABLE DIAGNOSTIC TOOL\n');
  console.log('Checking environment variable setup...\n');

  try {
    // Test 1: Check if .env files exist
    console.log('🧪 Test 1: Environment File Check');
    const envFiles = await checkEnvFiles();
    console.log(`  Root .env exists: ${envFiles.root ? '✅ YES' : '❌ NO'}`);
    console.log(`  Server .env exists: ${envFiles.server ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Test 2: Load and validate environment variables
    console.log('🧪 Test 2: Environment Variable Validation');
    const envValidation = await validateEnvironmentVariables();
    
    console.log('  Required variables:');
    Object.entries(envValidation.required).forEach(([varName, status]) => {
      console.log(`    ${varName}: ${status.present ? '✅ PRESENT' : '❌ MISSING'}`);
      if (!status.present) {
        console.log(`      Expected type: ${status.expectedType}`);
      }
    });
    console.log('');

    // Test 3: Check variable types and formats
    console.log('🧪 Test 3: Variable Type and Format Check');
    const typeValidation = await validateVariableTypes();
    
    console.log('  Type validation:');
    Object.entries(typeValidation).forEach(([varName, validation]) => {
      console.log(`    ${varName}: ${validation.valid ? '✅ VALID' : '❌ INVALID'}`);
      if (!validation.valid) {
        console.log(`      Issue: ${validation.issue}`);
      }
    });
    console.log('');

    // Test 4: Test database connection
    console.log('🧪 Test 4: Database Connection Test');
    const dbTest = await testDatabaseConnection();
    console.log(`  Database connection: ${dbTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!dbTest.success) {
      console.log(`  Error: ${dbTest.error}`);
    }
    console.log('');

    // Test 5: Test Supabase connection
    console.log('🧪 Test 5: Supabase Connection Test');
    const supabaseTest = await testSupabaseConnection();
    console.log(`  Supabase connection: ${supabaseTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!supabaseTest.success) {
      console.log(`  Error: ${supabaseTest.error}`);
    }
    console.log('');

    // Test 6: Check for common configuration issues
    console.log('🧪 Test 6: Configuration Issue Check');
    const configIssues = await checkConfigurationIssues();
    if (configIssues.length > 0) {
      console.log('  ⚠️  Configuration issues found:');
      configIssues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    } else {
      console.log('  ✅ No configuration issues detected');
    }
    console.log('');

    // Summary and recommendations
    console.log('📊 ENVIRONMENT DIAGNOSTIC SUMMARY:');
    console.log(`  .env files: ${envFiles.root && envFiles.server ? '✅' : '❌'}`);
    console.log(`  Required vars: ${Object.values(envValidation.required).every(v => v.present) ? '✅' : '❌'}`);
    console.log(`  Type validation: ${Object.values(typeValidation).every(v => v.valid) ? '✅' : '❌'}`);
    console.log(`  Database connection: ${dbTest.success ? '✅' : '❌'}`);
    console.log(`  Supabase connection: ${supabaseTest.success ? '✅' : '❌'}`);
    console.log('');

    if (!envFiles.root || !envFiles.server) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Missing .env files');
      console.log('💡 SOLUTION: Create missing .env files');
      console.log('   Copy env.example to .env and fill in values');
    } else if (!Object.values(envValidation.required).every(v => v.present)) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Missing required environment variables');
      console.log('💡 SOLUTION: Add missing variables to .env files');
    } else if (!dbTest.success) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Database connection failing');
      console.log('💡 SOLUTION: Check SUPABASE_DB_URL in .env');
    } else if (!supabaseTest.success) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Supabase connection failing');
      console.log('💡 SOLUTION: Check Supabase credentials in .env');
    } else {
      console.log('✅ Environment appears to be properly configured');
      console.log('💡 If SimplyAvi is still having issues, check:');
      console.log('   - Backend server startup');
      console.log('   - Network connectivity');
      console.log('   - Frontend configuration');
    }

  } catch (error) {
    console.error('❌ Environment diagnostic failed:', error.message);
  }
};

// Helper functions
async function checkEnvFiles() {
  const rootEnv = fs.existsSync(path.join(process.cwd(), '..', '.env'));
  const serverEnv = fs.existsSync(path.join(process.cwd(), '.env'));
  
  return {
    root: rootEnv,
    server: serverEnv
  };
}

async function validateEnvironmentVariables() {
  const required = {};
  
  for (const [varName, expectedType] of Object.entries(EXPECTED_VARS)) {
    const value = process.env[varName];
    required[varName] = {
      present: !!value,
      expectedType: expectedType
    };
  }
  
  return { required };
}

async function validateVariableTypes() {
  const validation = {};
  
  // Check URL formats
  const urlVars = ['SUPABASE_URL', 'SUPABASE_DB_URL', 'REACT_APP_API_URL'];
  urlVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      try {
        new URL(value);
        validation[varName] = { valid: true };
      } catch (error) {
        validation[varName] = { valid: false, issue: 'Invalid URL format' };
      }
    } else {
      validation[varName] = { valid: false, issue: 'Variable not set' };
    }
  });
  
  // Check boolean values
  const boolVars = ['SUPABASE_IDENTITY_LINKING_ENABLED'];
  boolVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const isValid = value === 'true' || value === 'false';
      validation[varName] = { 
        valid: isValid, 
        issue: isValid ? null : 'Should be "true" or "false"' 
      };
    } else {
      validation[varName] = { valid: false, issue: 'Variable not set' };
    }
  });
  
  // Check JWT secrets (should be long enough)
  const jwtVars = ['JWT_SECRET', 'SUPABASE_JWT_SECRET'];
  jwtVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const isValid = value.length >= 32;
      validation[varName] = { 
        valid: isValid, 
        issue: isValid ? null : 'Should be at least 32 characters' 
      };
    } else {
      validation[varName] = { valid: false, issue: 'Variable not set' };
    }
  });
  
  return validation;
}

async function testDatabaseConnection() {
  const { Client } = require('pg');
  
  try {
    const dbUrl = process.env.SUPABASE_DB_URL;
    if (!dbUrl) {
      return { success: false, error: 'SUPABASE_DB_URL not set' };
    }
    
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testSupabaseConnection() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, error: 'SUPABASE_URL or SUPABASE_ANON_KEY not set' };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('AllergenDerivatives').select('count').limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkConfigurationIssues() {
  const issues = [];
  
  // Check for common issues
  const reactAppUrl = process.env.REACT_APP_API_URL;
  if (reactAppUrl && !reactAppUrl.includes('localhost:5001')) {
    issues.push('REACT_APP_API_URL should point to localhost:5001 for local development');
  }
  
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'acceptance'].includes(nodeEnv)) {
    issues.push('NODE_ENV should be development, production, or acceptance');
  }
  
  // Check for missing Google OAuth config
  if (!process.env.GOOGLE_CLIENT_ID && !process.env.REACT_APP_GOOGLE_CLIENT_ID) {
    issues.push('Google OAuth client ID not configured');
  }
  
  return issues;
}

// Run the diagnostic
debugEnvironment(); 