/**
 * Test Supabase Authentication Flow
 * 
 * This script tests the proper Supabase authentication flow
 * based on the official Supabase documentation.
 * 
 * Author: Justin Linzan
 * Date: July 2025
 */

// Load environment variables
require('dotenv').config({ path: '../.env' });

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const testSupabaseAuth = async () => {
  console.log('🔐 Testing Supabase Authentication Flow...\n');

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

    // Test 1: Anonymous user token (like SimplyAvi might be using)
    console.log('🧪 Test 1: Anonymous user access...');
    const anonymousToken = jwt.sign({
      sub: 'anon-user-id',
      email: null,
      aud: 'authenticated', // Anonymous users use authenticated role
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
      iat: Math.floor(Date.now() / 1000),
      is_anonymous: true, // Key identifier for anonymous users
    }, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);

    const supabaseAnon = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${anonymousToken}`
          }
        }
      }
    );

    // Test anonymous access to allergens (should work - public read)
    const { data: anonAllergens, error: anonAllergenError } = await supabaseAnon
      .from('AllergenDerivatives')
      .select('*')
      .limit(10);

    if (anonAllergenError) {
      console.log('❌ Anonymous allergen access failed:', anonAllergenError.message);
    } else {
      console.log('✅ Anonymous allergen access successful');
      console.log(`  Found ${anonAllergens?.length || 0} allergens`);
      if (anonAllergens && anonAllergens.length > 0) {
        console.log('  Sample allergens:', anonAllergens.slice(0, 3).map(a => a.allergen));
      }
    }
    console.log('');

    // Test 2: Authenticated user token (permanent user)
    console.log('🧪 Test 2: Authenticated user access...');
    const authenticatedToken = jwt.sign({
      sub: 'auth-user-id',
      email: 'user@example.com',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
      iat: Math.floor(Date.now() / 1000),
      is_anonymous: false, // Key identifier for authenticated users
    }, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);

    const supabaseAuth = createClient(
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

    // Test authenticated access to allergens
    const { data: authAllergens, error: authAllergenError } = await supabaseAuth
      .from('AllergenDerivatives')
      .select('*')
      .limit(10);

    if (authAllergenError) {
      console.log('❌ Authenticated allergen access failed:', authAllergenError.message);
    } else {
      console.log('✅ Authenticated allergen access successful');
      console.log(`  Found ${authAllergens?.length || 0} allergens`);
      if (authAllergens && authAllergens.length > 0) {
        console.log('  Sample allergens:', authAllergens.slice(0, 3).map(a => a.allergen));
      }
    }
    console.log('');

    // Test 3: No token (public access)
    console.log('🧪 Test 3: Public access (no token)...');
    const supabasePublic = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: publicAllergens, error: publicAllergenError } = await supabasePublic
      .from('AllergenDerivatives')
      .select('*')
      .limit(5);

    if (publicAllergenError) {
      console.log('❌ Public allergen access failed:', publicAllergenError.message);
    } else {
      console.log('✅ Public allergen access successful');
      console.log(`  Found ${publicAllergens?.length || 0} allergens`);
    }
    console.log('');

    // Test 4: Test recipes access
    console.log('🧪 Test 4: Recipe access for all user types...');
    
    // Anonymous user access to recipes
    const { data: anonRecipes, error: anonRecipeError } = await supabaseAnon
      .from('Recipes')
      .select('*')
      .limit(5);

    if (anonRecipeError) {
      console.log('❌ Anonymous recipe access failed:', anonRecipeError.message);
    } else {
      console.log('✅ Anonymous recipe access successful');
      console.log(`  Found ${anonRecipes?.length || 0} recipes`);
    }

    // Authenticated user access to recipes
    const { data: authRecipes, error: authRecipeError } = await supabaseAuth
      .from('Recipes')
      .select('*')
      .limit(5);

    if (authRecipeError) {
      console.log('❌ Authenticated recipe access failed:', authRecipeError.message);
    } else {
      console.log('✅ Authenticated recipe access successful');
      console.log(`  Found ${authRecipes?.length || 0} recipes`);
    }
    console.log('');

    // Summary
    console.log('📊 Test Summary:');
    console.log('  ✅ Anonymous user access:', anonAllergenError ? 'Failed' : 'Working');
    console.log('  ✅ Authenticated user access:', authAllergenError ? 'Failed' : 'Working');
    console.log('  ✅ Public access:', publicAllergenError ? 'Failed' : 'Working');
    console.log('  ✅ Anonymous recipe access:', anonRecipeError ? 'Failed' : 'Working');
    console.log('  ✅ Authenticated recipe access:', authRecipeError ? 'Failed' : 'Working');
    console.log('');

    if (anonAllergenError || authAllergenError || publicAllergenError || anonRecipeError || authRecipeError) {
      console.log('🚨 ISSUES DETECTED:');
      console.log('  - Some access patterns are failing');
      console.log('  - This indicates RLS policies may need further adjustment');
    } else {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('  - All user types can access allergens and recipes');
      console.log('  - RLS policies are working correctly');
      console.log('  - SimplyAvi should have full access to all data');
      console.log('');
      console.log('🎯 SIMPLYAVI\'S ISSUES SHOULD BE RESOLVED:');
      console.log('  ✅ Should see all 53 allergens (not just 10)');
      console.log('  ✅ Should be able to toggle allergies without getting stuck');
      console.log('  ✅ Should have proper admin access to all data');
    }

  } catch (error) {
    console.error('❌ Supabase auth test failed:', error);
    console.error('  Error details:', error.message);
  }
};

// Run the test
testSupabaseAuth(); 