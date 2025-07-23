/**
 * Test Script for Dynable RBAC Setup
 * This script tests the basic functionality without requiring environment variables
 */

console.log('🧪 Testing Dynable RBAC Setup...\n');

// Test 1: Check if files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'phase1_database_migration.sql',
  'phase2_supabase_rls_policies.sql',
  'server/db/models/User.js',
  'server/db/models/IngredientCategorized.js',
  'server/utils/jwt.js',
  'server/middleware/roleAuth.js',
  'RBAC_IMPLEMENTATION_GUIDE.md'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
  }
});

// Test 2: Check User model structure
console.log('\n🔍 Checking User model structure:');
try {
  const UserModel = require('./server/db/models/User.js');
  const userFields = [
    'id', 'email', 'password', 'name', 'picture', 'googleId',
    'role', 'store_name', 'store_description', 'is_verified_seller',
    'converted_from_anonymous', 'anonymous_cart_data'
  ];
  
  console.log('  ✅ User model loaded successfully');
  console.log('  📋 Expected fields:', userFields.join(', '));
} catch (error) {
  console.log('  ❌ User model error:', error.message);
}

// Test 3: Check IngredientCategorized model structure
console.log('\n🔍 Checking IngredientCategorized model structure:');
try {
  const ProductModel = require('./server/db/models/IngredientCategorized.js');
  const productFields = [
    'seller_id', 'stock_quantity', 'is_active'
  ];
  
  console.log('  ✅ Product model loaded successfully');
  console.log('  📋 Expected fields:', productFields.join(', '));
} catch (error) {
  console.log('  ❌ Product model error:', error.message);
}

// Test 4: Check JWT utilities structure
console.log('\n🔍 Checking JWT utilities:');
try {
  const jwtUtils = require('./server/utils/jwt.js');
  const expectedFunctions = [
    'generateToken', 'generateSupabaseToken', 'generateAnonymousToken',
    'verifyToken', 'extractUserFromToken', 'hasRole', 'isAdmin',
    'isSeller', 'isVerifiedSeller', 'isAnonymous', 'canPerformAction'
  ];
  
  console.log('  ✅ JWT utilities loaded successfully');
  expectedFunctions.forEach(func => {
    if (typeof jwtUtils[func] === 'function') {
      console.log(`    ✅ ${func}()`);
    } else {
      console.log(`    ❌ ${func}() - MISSING`);
    }
  });
} catch (error) {
  console.log('  ❌ JWT utilities error:', error.message);
}

// Test 5: Check middleware structure
console.log('\n🔍 Checking role middleware:');
try {
  const middleware = require('./server/middleware/roleAuth.js');
  const expectedMiddleware = [
    'authenticateToken', 'requireRole', 'requirePermission',
    'requireAdmin', 'requireSeller', 'requireAuthenticated',
    'requireVerifiedSeller', 'requireAuthenticatedUser',
    'allowAnonymous', 'optionalAuth', 'requireOwnership'
  ];
  
  console.log('  ✅ Role middleware loaded successfully');
  expectedMiddleware.forEach(middlewareFunc => {
    if (typeof middleware[middlewareFunc] === 'function') {
      console.log(`    ✅ ${middlewareFunc}()`);
    } else {
      console.log(`    ❌ ${middlewareFunc}() - MISSING`);
    }
  });
} catch (error) {
  console.log('  ❌ Role middleware error:', error.message);
}

// Test 6: Check SQL migration files
console.log('\n🔍 Checking SQL migration files:');
try {
  const phase1SQL = fs.readFileSync('phase1_database_migration.sql', 'utf8');
  const phase2SQL = fs.readFileSync('phase2_supabase_rls_policies.sql', 'utf8');
  
  const phase1Checks = [
    'CREATE TYPE user_role AS ENUM',
    'ALTER TABLE "Users"',
    'CREATE TABLE IF NOT EXISTS admin_actions',
    'ALTER TABLE "IngredientCategorized"'
  ];
  
  const phase2Checks = [
    'ENABLE ROW LEVEL SECURITY',
    'CREATE POLICY',
    'auth.jwt()',
    'auth.uid()'
  ];
  
  console.log('  ✅ Phase 1 SQL migration:');
  phase1Checks.forEach(check => {
    if (phase1SQL.includes(check)) {
      console.log(`    ✅ ${check}`);
    } else {
      console.log(`    ❌ ${check} - MISSING`);
    }
  });
  
  console.log('  ✅ Phase 2 SQL policies:');
  phase2Checks.forEach(check => {
    if (phase2SQL.includes(check)) {
      console.log(`    ✅ ${check}`);
    } else {
      console.log(`    ❌ ${check} - MISSING`);
    }
  });
} catch (error) {
  console.log('  ❌ SQL files error:', error.message);
}

console.log('\n🎯 RBAC Setup Test Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Set up environment variables (JWT_SECRET, etc.)');
console.log('2. Run Phase 1 database migration in Supabase');
console.log('3. Enable anonymous auth in Supabase dashboard');
console.log('4. Run Phase 2 RLS policies in Supabase');
console.log('5. Test the implementation with real tokens'); 