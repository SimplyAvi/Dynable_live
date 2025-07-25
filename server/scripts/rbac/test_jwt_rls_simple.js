/**
 * Simple JWT RLS Test
 * 
 * This script tests JWT token recognition using the authenticated role
 * with custom claims instead of trying to create a custom admin role.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

// Load environment variables
require('dotenv').config({ path: '../.env' });

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const testSimpleJWTRLS = async () => {
  console.log('🔐 Testing Simple JWT RLS Recognition...\n');

  try {
    // Check environment variables
    console.log('📋 Environment Check:');
    console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    console.log('  SUPABASE_JWT_SECRET:', process.env.SUPABASE_JWT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ Missing required Supabase environment variables');
      return;
    }

    // Create test authenticated user token with admin claim
    console.log('🔑 Creating test authenticated JWT token with admin claim...');
    const authenticatedToken = jwt.sign({
      sub: '1',
      email: 'admin@test.com',
      aud: 'authenticated', // Use authenticated role
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
      iat: Math.floor(Date.now() / 1000),
      // Custom claims
      user_role: 'admin', // Custom claim for role
      is_admin: true,     // Custom claim for admin status
    }, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);

    console.log('✅ Authenticated JWT token created');
    console.log('  Token payload:', jwt.decode(authenticatedToken));
    console.log('');

    // Test Supabase client with authenticated token
    console.log('🔌 Initializing Supabase client with authenticated token...');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authenticatedToken}`
          }
        }
      }
    );

    console.log('✅ Supabase client initialized');
    console.log('');

    // Test 1: Authenticated access to allergens (should work)
    console.log('🧪 Test 1: Authenticated access to allergens...');
    const { data: allergens, error: allergenError } = await supabase
      .from('AllergenDerivatives')
      .select('*')
      .limit(10);

    if (allergenError) {
      console.log('❌ Allergen access failed:', allergenError.message);
    } else {
      console.log('✅ Allergen access successful');
      console.log(`  Found ${allergens?.length || 0} allergens`);
      if (allergens && allergens.length > 0) {
        console.log('  Sample allergens:', allergens.slice(0, 3).map(a => a.allergen));
      }
    }
    console.log('');

    // Test 2: Authenticated access to users
    console.log('🧪 Test 2: Authenticated access to users...');
    const { data: users, error: userError } = await supabase
      .from('Users')
      .select('*')
      .limit(5);

    if (userError) {
      console.log('❌ User access failed:', userError.message);
    } else {
      console.log('✅ User access successful');
      console.log(`  Found ${users?.length || 0} users`);
      if (users && users.length > 0) {
        console.log('  Sample users:', users.slice(0, 3).map(u => ({ id: u.id, email: u.email, role: u.role })));
      }
    }
    console.log('');

    // Test 3: Authenticated access to recipes
    console.log('🧪 Test 3: Authenticated access to recipes...');
    const { data: recipes, error: recipeError } = await supabase
      .from('Recipes')
      .select('*')
      .limit(5);

    if (recipeError) {
      console.log('❌ Recipe access failed:', recipeError.message);
    } else {
      console.log('✅ Recipe access successful');
      console.log(`  Found ${recipes?.length || 0} recipes`);
      if (recipes && recipes.length > 0) {
        console.log('  Sample recipes:', recipes.slice(0, 3).map(r => ({ id: r.id, title: r.title })));
      }
    }
    console.log('');

    // Test 4: Authenticated access to products
    console.log('🧪 Test 4: Authenticated access to products...');
    const { data: products, error: productError } = await supabase
      .from('IngredientCategorized')
      .select('*')
      .limit(5);

    if (productError) {
      console.log('❌ Product access failed:', productError.message);
    } else {
      console.log('✅ Product access successful');
      console.log(`  Found ${products?.length || 0} products`);
      if (products && products.length > 0) {
        console.log('  Sample products:', products.slice(0, 3).map(p => ({ id: p.id, description: p.description })));
      }
    }
    console.log('');

    // Test 5: Anonymous access (should work for public read)
    console.log('🧪 Test 5: Anonymous access...');
    const supabaseAnon = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: anonAllergens, error: anonError } = await supabaseAnon
      .from('AllergenDerivatives')
      .select('*')
      .limit(5);

    if (anonError) {
      console.log('❌ Anonymous access failed:', anonError.message);
    } else {
      console.log('✅ Anonymous access successful (public read policy working)');
      console.log(`  Found ${anonAllergens?.length || 0} allergens`);
    }
    console.log('');

    // Summary
    console.log('📊 Test Summary:');
    console.log('  ✅ JWT token generation: Working');
    console.log('  ✅ Supabase client: Working');
    console.log('  ✅ Authenticated allergen access:', allergenError ? 'Failed' : 'Working');
    console.log('  ✅ Authenticated user access:', userError ? 'Failed' : 'Working');
    console.log('  ✅ Authenticated recipe access:', recipeError ? 'Failed' : 'Working');
    console.log('  ✅ Authenticated product access:', productError ? 'Failed' : 'Working');
    console.log('  ✅ Anonymous access:', anonError ? 'Failed' : 'Working');
    console.log('');

    if (allergenError || userError || recipeError || productError) {
      console.log('🚨 ISSUES DETECTED:');
      console.log('  - Some authenticated operations are failing');
      console.log('  - This indicates RLS policies may need adjustment');
      console.log('  - The issue might be with custom claims in JWT');
    } else {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('  - JWT tokens are being recognized by RLS policies');
      console.log('  - Authenticated access is working correctly');
      console.log('  - SimplyAvi should have access to all data');
    }

  } catch (error) {
    console.error('❌ JWT RLS test failed:', error);
    console.error('  Error details:', error.message);
  }
};

// Run the test
testSimpleJWTRLS(); 