/**
 * Database Access Diagnostic Tool
 * 
 * This script tests direct database connectivity and RLS policies
 * to identify database-related issues.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const debugDatabaseAccess = async () => {
  console.log('🔍 DATABASE ACCESS DIAGNOSTIC TOOL\n');
  console.log('Testing database connectivity and RLS policies...\n');

  try {
    // Test 1: Basic database connection
    console.log('🧪 Test 1: Basic Database Connection');
    const connectionTest = await testBasicConnection();
    console.log(`  Database connection: ${connectionTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!connectionTest.success) {
      console.log(`  Error: ${connectionTest.error}`);
      return; // Stop if basic connection fails
    }
    console.log('');

    // Test 2: Test direct SQL queries
    console.log('🧪 Test 2: Direct SQL Query Tests');
    const sqlTests = await testDirectQueries();
    
    console.log('  Table access tests:');
    Object.entries(sqlTests).forEach(([tableName, result]) => {
      console.log(`    ${tableName}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!result.success) {
        console.log(`      Error: ${result.error}`);
      } else {
        console.log(`      Records found: ${result.count}`);
      }
    });
    console.log('');

    // Test 3: RLS policy tests
    console.log('🧪 Test 3: RLS Policy Tests');
    const rlsTests = await testRLSPolicies();
    
    console.log('  RLS policy tests:');
    Object.entries(rlsTests).forEach(([testName, result]) => {
      console.log(`    ${testName}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!result.success) {
        console.log(`      Error: ${result.error}`);
      } else {
        console.log(`      Records accessible: ${result.count}`);
      }
    });
    console.log('');

    // Test 4: JWT token tests
    console.log('🧪 Test 4: JWT Token Tests');
    const jwtTests = await testJWTTokens();
    
    console.log('  JWT token tests:');
    Object.entries(jwtTests).forEach(([tokenType, result]) => {
      console.log(`    ${tokenType}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!result.success) {
        console.log(`      Error: ${result.error}`);
      } else {
        console.log(`      Records accessible: ${result.count}`);
      }
    });
    console.log('');

    // Test 5: Allergen data verification
    console.log('🧪 Test 5: Allergen Data Verification');
    const allergenTest = await verifyAllergenData();
    console.log(`  Allergen data: ${allergenTest.success ? '✅ VERIFIED' : '❌ ISSUES'}`);
    if (allergenTest.success) {
      console.log(`    Total allergens: ${allergenTest.totalAllergens}`);
      console.log(`    Unique allergens: ${allergenTest.uniqueAllergens}`);
      console.log(`    Sample allergens: ${allergenTest.sampleAllergens.join(', ')}`);
    } else {
      console.log(`    Error: ${allergenTest.error}`);
    }
    console.log('');

    // Test 6: Recipe data verification
    console.log('🧪 Test 6: Recipe Data Verification');
    const recipeTest = await verifyRecipeData();
    console.log(`  Recipe data: ${recipeTest.success ? '✅ VERIFIED' : '❌ ISSUES'}`);
    if (recipeTest.success) {
      console.log(`    Total recipes: ${recipeTest.totalRecipes}`);
      console.log(`    Recipes with ingredients: ${recipeTest.recipesWithIngredients}`);
      console.log(`    Sample recipes: ${recipeTest.sampleRecipes.join(', ')}`);
    } else {
      console.log(`    Error: ${recipeTest.error}`);
    }
    console.log('');

    // Summary and recommendations
    console.log('📊 DATABASE DIAGNOSTIC SUMMARY:');
    console.log(`  Basic connection: ${connectionTest.success ? '✅' : '❌'}`);
    console.log(`  SQL queries: ${Object.values(sqlTests).every(t => t.success) ? '✅' : '❌'}`);
    console.log(`  RLS policies: ${Object.values(rlsTests).every(t => t.success) ? '✅' : '❌'}`);
    console.log(`  JWT tokens: ${Object.values(jwtTests).every(t => t.success) ? '✅' : '❌'}`);
    console.log(`  Allergen data: ${allergenTest.success ? '✅' : '❌'}`);
    console.log(`  Recipe data: ${recipeTest.success ? '✅' : '❌'}`);
    console.log('');

    if (!connectionTest.success) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Database connection failing');
      console.log('💡 SOLUTION: Check SUPABASE_DB_URL in environment');
    } else if (!Object.values(sqlTests).every(t => t.success)) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: Some tables not accessible');
      console.log('💡 SOLUTION: Check table permissions and RLS policies');
    } else if (!Object.values(rlsTests).every(t => t.success)) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: RLS policies blocking access');
      console.log('💡 SOLUTION: Check RLS policy configuration');
    } else {
      console.log('✅ Database access appears to be working correctly');
      console.log('💡 If SimplyAvi is still having issues, check:');
      console.log('   - Backend server configuration');
      console.log('   - Frontend API calls');
      console.log('   - Network connectivity');
    }

  } catch (error) {
    console.error('❌ Database diagnostic failed:', error.message);
  }
};

// Helper functions
async function testBasicConnection() {
  try {
    const dbUrl = process.env.SUPABASE_DB_URL;
    if (!dbUrl) {
      return { success: false, error: 'SUPABASE_DB_URL not set' };
    }
    
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    const result = await client.query('SELECT version()');
    await client.end();
    
    return { success: true, version: result.rows[0].version };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testDirectQueries() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();
  
  const tests = {};
  
  try {
    // Test AllergenDerivatives
    const allergenResult = await client.query('SELECT COUNT(*) FROM "AllergenDerivatives"');
    tests.AllergenDerivatives = { success: true, count: parseInt(allergenResult.rows[0].count) };
  } catch (error) {
    tests.AllergenDerivatives = { success: false, error: error.message };
  }
  
  try {
    // Test Recipes
    const recipeResult = await client.query('SELECT COUNT(*) FROM "Recipes"');
    tests.Recipes = { success: true, count: parseInt(recipeResult.rows[0].count) };
  } catch (error) {
    tests.Recipes = { success: false, error: error.message };
  }
  
  try {
    // Test IngredientCategorized
    const productResult = await client.query('SELECT COUNT(*) FROM "IngredientCategorized"');
    tests.IngredientCategorized = { success: true, count: parseInt(productResult.rows[0].count) };
  } catch (error) {
    tests.IngredientCategorized = { success: false, error: error.message };
  }
  
  await client.end();
  return tests;
}

async function testRLSPolicies() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();
  
  const tests = {};
  
  try {
    // Test public read access
    const publicResult = await client.query('SELECT COUNT(*) FROM "AllergenDerivatives"');
    tests['Public Read Access'] = { success: true, count: parseInt(publicResult.rows[0].count) };
  } catch (error) {
    tests['Public Read Access'] = { success: false, error: error.message };
  }
  
  try {
    // Test authenticated access
    const authResult = await client.query('SELECT COUNT(*) FROM "Users"');
    tests['Authenticated Access'] = { success: true, count: parseInt(authResult.rows[0].count) };
  } catch (error) {
    tests['Authenticated Access'] = { success: false, error: error.message };
  }
  
  await client.end();
  return tests;
}

async function testJWTTokens() {
  const tests = {};
  
  try {
    // Test anonymous token
    const anonymousToken = jwt.sign({
      sub: 'anon-user-id',
      aud: 'authenticated',
      is_anonymous: true
    }, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);
    
    const client = new Client({ 
      connectionString: process.env.SUPABASE_DB_URL,
      options: `--application_name=test_anonymous`
    });
    await client.connect();
    
    // Set JWT for this session
    await client.query(`SET LOCAL "request.jwt.claim.sub" = 'anon-user-id'`);
    await client.query(`SET LOCAL "request.jwt.claim.aud" = 'authenticated'`);
    await client.query(`SET LOCAL "request.jwt.claim.is_anonymous" = 'true'`);
    
    const result = await client.query('SELECT COUNT(*) FROM "AllergenDerivatives"');
    tests['Anonymous JWT'] = { success: true, count: parseInt(result.rows[0].count) };
    
    await client.end();
  } catch (error) {
    tests['Anonymous JWT'] = { success: false, error: error.message };
  }
  
  try {
    // Test authenticated token
    const authenticatedToken = jwt.sign({
      sub: 'auth-user-id',
      aud: 'authenticated',
      is_anonymous: false
    }, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);
    
    const client = new Client({ 
      connectionString: process.env.SUPABASE_DB_URL,
      options: `--application_name=test_authenticated`
    });
    await client.connect();
    
    // Set JWT for this session
    await client.query(`SET LOCAL "request.jwt.claim.sub" = 'auth-user-id'`);
    await client.query(`SET LOCAL "request.jwt.claim.aud" = 'authenticated'`);
    await client.query(`SET LOCAL "request.jwt.claim.is_anonymous" = 'false'`);
    
    const result = await client.query('SELECT COUNT(*) FROM "AllergenDerivatives"');
    tests['Authenticated JWT'] = { success: true, count: parseInt(result.rows[0].count) };
    
    await client.end();
  } catch (error) {
    tests['Authenticated JWT'] = { success: false, error: error.message };
  }
  
  return tests;
}

async function verifyAllergenData() {
  try {
    const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_allergens,
        COUNT(DISTINCT allergen) as unique_allergens,
        array_agg(DISTINCT allergen) FILTER (WHERE allergen IS NOT NULL) as sample_allergens
      FROM "AllergenDerivatives"
    `);
    
    await client.end();
    
    const row = result.rows[0];
    return {
      success: true,
      totalAllergens: parseInt(row.total_allergens),
      uniqueAllergens: parseInt(row.unique_allergens),
      sampleAllergens: row.sample_allergens.slice(0, 5) || []
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function verifyRecipeData() {
  try {
    const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
    await client.connect();
    
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_recipes,
        COUNT(DISTINCT r.id) as recipes_with_ingredients,
        array_agg(DISTINCT r.title) FILTER (WHERE r.title IS NOT NULL) as sample_recipes
      FROM "Recipes" r
      LEFT JOIN "RecipeIngredients" ri ON r.id = ri."RecipeId"
    `);
    
    await client.end();
    
    const row = result.rows[0];
    return {
      success: true,
      totalRecipes: parseInt(row.total_recipes),
      recipesWithIngredients: parseInt(row.recipes_with_ingredients),
      sampleRecipes: row.sample_recipes.slice(0, 3) || []
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run the diagnostic
debugDatabaseAccess(); 