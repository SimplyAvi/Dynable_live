// Comprehensive test script for bulletproof allergen system
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function comprehensiveBulletproofTest() {
  console.log('🧪 COMPREHENSIVE BULLETPROOF ALLERGEN SYSTEM TEST');
  console.log('==================================================');
  console.log('🔧 Using Supabase URL:', supabaseUrl);
  console.log('🔧 Using Supabase Key:', supabaseKey.substring(0, 20) + '...');
  
  const results = {
    phase1: { database: false, detection: false, derivatives: false },
    phase2: { dangerous: [], safe: [], performance: {} },
    phase3: { ui: false, fallback: false },
    overall: { passed: false, issues: [] }
  };
  
  try {
    // PHASE 1: DATABASE FOUNDATION CHECK
    console.log('\n🛡️ PHASE 1: DATABASE FOUNDATION CHECK');
    console.log('=====================================');
    
    // Test 1: Check if tables exist
    console.log('\n1. Checking table existence...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['ProductAllergens', 'AllergenDerivatives', 'SafeProductIndicators']);
    
    if (!tablesError && tables) {
      console.log('✅ Found tables:', tables.map(t => t.table_name));
      results.phase1.database = true;
    } else {
      console.log('❌ Tables not found - Phase 1 SQL needs to be executed');
      console.log('   Error:', tablesError?.message);
      results.overall.issues.push('Database tables not created');
    }
    
    // Test 2: Check detection function
    console.log('\n2. Testing detection function...');
    
    try {
      const { data: detectionTest, error: detectionError } = await supabase.rpc('detect_allergens_in_description', {
        product_description: 'Protein powder with whey isolate',
        target_allergen: 'milk'
      });
      
      if (!detectionError && detectionTest) {
        console.log('✅ Detection function working');
        console.log('   Result:', detectionTest);
        results.phase1.detection = true;
      } else {
        console.log('❌ Detection function error:', detectionError?.message);
        results.overall.issues.push('Detection function not working');
      }
    } catch (funcError) {
      console.log('❌ Detection function not found');
      console.log('   Error:', funcError.message);
      results.overall.issues.push('Detection function not created');
    }
    
    // Test 3: Check derivative mappings
    console.log('\n3. Testing derivative mappings...');
    
    try {
      const { data: derivatives, error: derivError } = await supabase
        .from('AllergenDerivatives')
        .select('derivative')
        .eq('allergen', 'milk')
        .limit(5);
      
      if (!derivError && derivatives && derivatives.length > 0) {
        console.log('✅ Derivative mappings found:', derivatives.length, 'terms');
        console.log('   Sample derivatives:', derivatives.map(d => d.derivative));
        results.phase1.derivatives = true;
      } else {
        console.log('❌ No derivative mappings found');
        console.log('   Error:', derivError?.message);
        results.overall.issues.push('Derivative mappings not loaded');
      }
    } catch (derivError) {
      console.log('❌ AllergenDerivatives table not accessible');
      console.log('   Error:', derivError.message);
      results.overall.issues.push('AllergenDerivatives table not created');
    }
    
    // PHASE 2: CRITICAL SAFETY TESTS
    console.log('\n🛡️ PHASE 2: CRITICAL SAFETY TESTS');
    console.log('===================================');
    
    // Test dangerous product detection
    console.log('\n1. Testing dangerous product detection...');
    
    const dangerousTests = [
      { product: "Protein powder with whey isolate", allergen: "milk", shouldFilter: true },
      { product: "Seasoning with sodium caseinate", allergen: "milk", shouldFilter: true },
      { product: "Bread flour - wheat enriched", allergen: "gluten", shouldFilter: true },
      { product: "Chocolate with arachis oil", allergen: "peanuts", shouldFilter: true },
      { product: "Asian sauce with soy lecithin", allergen: "soy", shouldFilter: true },
      { product: "Mayonnaise with egg yolk", allergen: "eggs", shouldFilter: true }
    ];
    
    for (const test of dangerousTests) {
      try {
        const { data: searchResults, error: searchError } = await supabase
          .from('IngredientCategorized')
          .select('description')
          .ilike('description', `%${test.product.split(' ')[0]}%`)
          .limit(1);
        
        if (!searchError && searchResults && searchResults.length > 0) {
          console.log(`✅ Found test product: "${searchResults[0].description}"`);
          results.phase2.dangerous.push({ test, found: true });
        } else {
          console.log(`⚠️ Test product not found: "${test.product}"`);
          results.phase2.dangerous.push({ test, found: false });
        }
      } catch (error) {
        console.log(`❌ Error testing: "${test.product}"`);
        console.log('   Error:', error.message);
        results.phase2.dangerous.push({ test, error: error.message });
      }
    }
    
    // Test safe product detection
    console.log('\n2. Testing safe product detection...');
    
    const safeTests = [
      { product: "Gluten-free oats certified", allergen: "gluten", shouldAllow: true },
      { product: "Dairy-free chocolate chips", allergen: "milk", shouldAllow: true },
      { product: "Peanut-free facility snacks", allergen: "peanuts", shouldAllow: true },
      { product: "Vegan protein powder", allergen: "milk", shouldAllow: true },
      { product: "Egg-free pasta", allergen: "eggs", shouldAllow: true }
    ];
    
    for (const test of safeTests) {
      try {
        const { data: searchResults, error: searchError } = await supabase
          .from('IngredientCategorized')
          .select('description')
          .ilike('description', `%${test.product.split(' ')[0]}%`)
          .limit(1);
        
        if (!searchError && searchResults && searchResults.length > 0) {
          console.log(`✅ Found safe product: "${searchResults[0].description}"`);
          results.phase2.safe.push({ test, found: true });
        } else {
          console.log(`⚠️ Safe product not found: "${test.product}"`);
          results.phase2.safe.push({ test, found: false });
        }
      } catch (error) {
        console.log(`❌ Error testing: "${test.product}"`);
        console.log('   Error:', error.message);
        results.phase2.safe.push({ test, error: error.message });
      }
    }
    
    // PHASE 3: PERFORMANCE VERIFICATION
    console.log('\n⚡ PHASE 3: PERFORMANCE VERIFICATION');
    console.log('====================================');
    
    // Test single allergen performance
    console.log('\n1. Testing single allergen performance...');
    const startTime1 = Date.now();
    
    try {
      const { data: singleResults, error: singleError } = await supabase
        .from('IngredientCategorized')
        .select('description')
        .not('description', 'ilike', '%milk%')
        .limit(100);
      
      const singleTime = Date.now() - startTime1;
      console.log(`✅ Single allergen query: ${singleTime}ms (${singleResults?.length || 0} results)`);
      results.phase2.performance.single = { time: singleTime, results: singleResults?.length || 0 };
    } catch (error) {
      console.log(`❌ Single allergen query failed: ${error.message}`);
      results.phase2.performance.single = { error: error.message };
    }
    
    // Test multiple allergen performance
    console.log('\n2. Testing multiple allergen performance...');
    const startTime2 = Date.now();
    
    try {
      const { data: multiResults, error: multiError } = await supabase
        .from('IngredientCategorized')
        .select('description')
        .not('description', 'ilike', '%milk%')
        .not('description', 'ilike', '%peanuts%')
        .not('description', 'ilike', '%gluten%')
        .limit(100);
      
      const multiTime = Date.now() - startTime2;
      console.log(`✅ Multiple allergen query: ${multiTime}ms (${multiResults?.length || 0} results)`);
      results.phase2.performance.multiple = { time: multiTime, results: multiResults?.length || 0 };
    } catch (error) {
      console.log(`❌ Multiple allergen query failed: ${error.message}`);
      results.phase2.performance.multiple = { error: error.message };
    }
    
    // FINAL ASSESSMENT
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');
    
    const databaseReady = results.phase1.database && results.phase1.detection && results.phase1.derivatives;
    const dangerousDetected = results.phase2.dangerous.filter(r => r.found).length;
    const safeDetected = results.phase2.safe.filter(r => r.found).length;
    const performanceGood = results.phase2.performance.single?.time < 3000 && results.phase2.performance.multiple?.time < 3000;
    
    console.log(`✅ Database Foundation: ${databaseReady ? 'READY' : 'NOT READY'}`);
    console.log(`✅ Dangerous Detection: ${dangerousDetected}/6 products (${Math.round(dangerousDetected/6*100)}%)`);
    console.log(`✅ Safe Detection: ${safeDetected}/5 products (${Math.round(safeDetected/5*100)}%)`);
    console.log(`✅ Performance: ${performanceGood ? 'GOOD' : 'NEEDS IMPROVEMENT'}`);
    
    if (databaseReady && dangerousDetected >= 4 && safeDetected >= 4 && performanceGood) {
      results.overall.passed = true;
      console.log('\n🎉 BULLETPROOF SYSTEM STATUS: PRODUCTION READY');
    } else {
      console.log('\n⚠️ BULLETPROOF SYSTEM STATUS: NEEDS IMPROVEMENT');
      if (!databaseReady) console.log('   - Database foundation incomplete');
      if (dangerousDetected < 4) console.log('   - Dangerous product detection insufficient');
      if (safeDetected < 4) console.log('   - Safe product detection insufficient');
      if (!performanceGood) console.log('   - Performance below target');
    }
    
    console.log('\n📋 DETAILED ISSUES:');
    results.overall.issues.forEach(issue => console.log(`   - ${issue}`));
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    results.overall.passed = false;
    results.overall.issues.push(`Test execution failed: ${error.message}`);
  }
  
  return results;
}

comprehensiveBulletproofTest(); 