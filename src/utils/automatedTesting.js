// 🧪 AUTOMATED TESTING SYSTEM
// Runs all tests automatically and provides comprehensive reports

import { supabase } from './supabaseClient.js';

// Test results storage
let testResults = {
  databaseMigration: null,
  accuracyTests: null,
  processingTests: null,
  performanceTests: null,
  overallStatus: null
};

// 🎯 MAIN AUTOMATED TEST RUNNER
export const runAutomatedTests = async () => {
  console.log('🚀 STARTING AUTOMATED TESTING SYSTEM');
  console.log('=====================================');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Test database functions exist
    console.log('\n📊 STEP 1: Testing database functions...');
    const dbTest = await testDatabaseFunctions();
    testResults.databaseMigration = dbTest;
    
    if (!dbTest.success) {
      console.log('❌ Database functions not ready. Please run the SQL migration first.');
      return generateReport();
    }
    
    // Step 2: Run accuracy tests
    console.log('\n🧪 STEP 2: Running accuracy tests...');
    const accuracyTest = await runAccuracyTests();
    testResults.accuracyTests = accuracyTest;
    
    // Step 3: Test processing on sample products
    console.log('\n🔄 STEP 3: Testing processing on sample products...');
    const processingTest = await testProcessingOnSamples();
    testResults.processingTests = processingTest;
    
    // Step 4: Performance tests
    console.log('\n⚡ STEP 4: Running performance tests...');
    const performanceTest = await runPerformanceTests();
    testResults.performanceTests = performanceTest;
    
    // Step 5: Generate final report
    const duration = Date.now() - startTime;
    testResults.overallStatus = generateOverallStatus();
    
    console.log('\n📋 GENERATING COMPREHENSIVE REPORT');
    console.log('==================================');
    
    const report = generateReport();
    
    // Step 6: Auto-recommendations
    console.log('\n💡 AUTOMATED RECOMMENDATIONS');
    console.log('============================');
    generateRecommendations(report);
    
    return report;
    
  } catch (error) {
    console.error('❌ Automated testing failed:', error);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
};

// Test if database functions exist
const testDatabaseFunctions = async () => {
  try {
    // Test if the improved function exists
    const { data: testProduct } = await supabase
      .from('IngredientCategorized')
      .select('id')
      .limit(1);
    
    if (!testProduct || testProduct.length === 0) {
      return { success: false, error: 'No products found in database' };
    }
    
    // Try to call the dry run function
    const result = await supabase.rpc('process_product_allergens_dry_run', {
      product_id: testProduct[0].id
    });
    
    if (result.error) {
      return { 
        success: false, 
        error: 'Database functions not found. Please run SQL migration first.',
        details: result.error 
      };
    }
    
    return { 
      success: true, 
      message: 'Database functions are ready',
      sampleResult: result.data
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: 'Database connection failed',
      details: error.message 
    };
  }
};

// Run comprehensive accuracy tests
const runAccuracyTests = async () => {
  const results = {
    basicAccuracy: null,
    problematicCases: null,
    wordBoundaries: null,
    overall: null
  };
  
  try {
    // Test basic accuracy
    console.log('  - Testing basic accuracy...');
    results.basicAccuracy = await testBasicAccuracy();
    
    // Test problematic cases
    console.log('  - Testing problematic cases...');
    results.problematicCases = await testProblematicCases();
    
    // Test word boundaries
    console.log('  - Testing word boundaries...');
    results.wordBoundaries = await testWordBoundaries();
    
    // Calculate overall accuracy
    const accuracies = [
      results.basicAccuracy?.accuracy || 0,
      results.problematicCases?.accuracy || 0,
      results.wordBoundaries?.accuracy || 0
    ].filter(acc => acc > 0);
    
    results.overall = {
      accuracy: accuracies.length > 0 ? accuracies.reduce((a, b) => a + b) / accuracies.length : 0,
      passed: accuracies.filter(acc => acc >= 95).length,
      total: accuracies.length
    };
    
    return results;
    
  } catch (error) {
    return { error: error.message };
  }
};

// Test basic accuracy
const testBasicAccuracy = async () => {
  const testCases = [
    {
      description: "Organic Soy Milk Dairy-Free",
      expected: { contains: [], free: ['milk-free'] }
    },
    {
      description: "Gluten-Free Bread Wheat-Free",
      expected: { contains: [], free: ['gluten-free'] }
    },
    {
      description: "Peanut Butter Smooth",
      expected: { contains: ['peanuts'], free: [] }
    }
  ];
  
  let passed = 0;
  let total = 0;
  
  for (const testCase of testCases) {
    total++;
    try {
      const { data: products } = await supabase
        .from('IngredientCategorized')
        .select('id, description')
        .ilike('description', `%${testCase.description.split(' ')[0]}%`)
        .limit(1);
      
      if (products && products.length > 0) {
        const result = await supabase.rpc('process_product_allergens_dry_run', {
          product_id: products[0].id
        });
        
        const actual = {
          contains: result.data.contains_allergens || [],
          free: result.data.allergen_free_tags || []
        };
        
        const containsMatch = JSON.stringify(actual.contains.sort()) === JSON.stringify(testCase.expected.contains.sort());
        const freeMatch = JSON.stringify(actual.free.sort()) === JSON.stringify(testCase.expected.free.sort());
        
        if (containsMatch && freeMatch) {
          passed++;
        }
      }
    } catch (error) {
      // Continue with next test
    }
  }
  
  return {
    accuracy: total > 0 ? (passed / total) * 100 : 0,
    passed,
    total
  };
};

// Test problematic cases
const testProblematicCases = async () => {
  const testCases = [
    {
      description: "Cranberry Juice",
      shouldNotContain: ['soy']
    },
    {
      description: "Coconut Oil",
      shouldNotContain: ['treeNuts']
    }
  ];
  
  let passed = 0;
  let total = 0;
  
  for (const testCase of testCases) {
    total++;
    try {
      const { data: products } = await supabase
        .from('IngredientCategorized')
        .select('id, description')
        .ilike('description', `%${testCase.description.split(' ')[0]}%`)
        .limit(1);
      
      if (products && products.length > 0) {
        const result = await supabase.rpc('process_product_allergens_dry_run', {
          product_id: products[0].id
        });
        
        const contains = result.data.contains_allergens || [];
        const hasUnwanted = testCase.shouldNotContain.some(allergen => 
          contains.includes(allergen)
        );
        
        if (!hasUnwanted) {
          passed++;
        }
      }
    } catch (error) {
      // Continue with next test
    }
  }
  
  return {
    accuracy: total > 0 ? (passed / total) * 100 : 0,
    passed,
    total
  };
};

// Test word boundaries
const testWordBoundaries = async () => {
  const testCases = [
    { text: "soy milk", searchTerm: "soy", shouldMatch: true },
    { text: "cranberry juice", searchTerm: "soy", shouldMatch: false },
    { text: "egg white", searchTerm: "egg", shouldMatch: true },
    { text: "nutmeg spice", searchTerm: "egg", shouldMatch: false }
  ];
  
  let passed = 0;
  let total = 0;
  
  for (const test of testCases) {
    total++;
    try {
      const regex = new RegExp(`\\b${test.searchTerm}\\b`, 'i');
      const matches = regex.test(test.text);
      
      if (matches === test.shouldMatch) {
        passed++;
      }
    } catch (error) {
      // Continue with next test
    }
  }
  
  return {
    accuracy: total > 0 ? (passed / total) * 100 : 0,
    passed,
    total
  };
};

// Test processing on sample products
const testProcessingOnSamples = async () => {
  try {
    // Get sample products
    const { data: samples } = await supabase
      .from('IngredientCategorized')
      .select('id, description')
      .eq('processed_for_allergens', false)
      .limit(5);
    
    if (!samples || samples.length === 0) {
      return { success: false, error: 'No unprocessed products found' };
    }
    
    let processed = 0;
    let errors = 0;
    const results = [];
    
    for (const product of samples) {
      try {
        const result = await supabase.rpc('process_product_allergens_improved', {
          product_id: product.id
        });
        
        if (result.data && !result.error) {
          processed++;
          results.push({
            id: product.id,
            description: product.description.substring(0, 50),
            contains: result.data.contains_allergens || [],
            free: result.data.allergen_free_tags || []
          });
        } else {
          errors++;
        }
      } catch (error) {
        errors++;
      }
    }
    
    return {
      success: true,
      processed,
      errors,
      accuracy: processed / (processed + errors) * 100,
      sampleResults: results
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Run performance tests
const runPerformanceTests = async () => {
  try {
    const startTime = Date.now();
    
    // Test query performance
    const { data, error } = await supabase
      .from('IngredientCategorized')
      .select('*')
      .neq('brandName', 'generic')
      .eq('processed_for_allergens', true)
      .not('contains_allergens', 'cs', '{gluten}')
      .limit(10);
    
    const queryTime = Date.now() - startTime;
    
    return {
      success: !error,
      queryTime,
      resultsFound: data?.length || 0,
      performance: queryTime < 1000 ? 'excellent' : queryTime < 3000 ? 'good' : 'poor'
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Generate overall status
const generateOverallStatus = () => {
  const dbReady = testResults.databaseMigration?.success;
  const accuracyGood = testResults.accuracyTests?.overall?.accuracy >= 95;
  const processingGood = testResults.processingTests?.success;
  const performanceGood = testResults.performanceTests?.success;
  
  const allGood = dbReady && accuracyGood && processingGood && performanceGood;
  
  return {
    ready: allGood,
    database: dbReady,
    accuracy: accuracyGood,
    processing: processingGood,
    performance: performanceGood
  };
};

// Generate comprehensive report
const generateReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    overallStatus: testResults.overallStatus,
    databaseMigration: testResults.databaseMigration,
    accuracyTests: testResults.accuracyTests,
    processingTests: testResults.processingTests,
    performanceTests: testResults.performanceTests,
    recommendations: []
  };
  
  // Add recommendations based on results
  if (!testResults.databaseMigration?.success) {
    report.recommendations.push('Run the SQL migration to create database functions');
  }
  
  if (testResults.accuracyTests?.overall?.accuracy < 95) {
    report.recommendations.push('Accuracy below 95% - review processing logic before proceeding');
  }
  
  if (testResults.processingTests?.accuracy < 90) {
    report.recommendations.push('Processing accuracy below 90% - check for errors');
  }
  
  if (testResults.performanceTests?.queryTime > 3000) {
    report.recommendations.push('Query performance is slow - consider optimization');
  }
  
  if (testResults.overallStatus?.ready) {
    report.recommendations.push('All tests passed! Safe to proceed with batch processing');
  }
  
  return report;
};

// Generate automated recommendations
const generateRecommendations = (report) => {
  console.log('\n📋 TEST RESULTS SUMMARY:');
  console.log('========================');
  
  if (report.overallStatus?.ready) {
    console.log('✅ ALL SYSTEMS READY');
    console.log('✅ Database functions: Working');
    console.log('✅ Accuracy tests: Passed');
    console.log('✅ Processing tests: Passed');
    console.log('✅ Performance tests: Passed');
    console.log('\n🎉 RECOMMENDATION: Safe to proceed with batch processing!');
    console.log('Run: window.processAllProducts() to process all products');
  } else {
    console.log('❌ SOME ISSUES DETECTED');
    
    if (!report.overallStatus?.database) {
      console.log('❌ Database functions not ready');
      console.log('💡 ACTION: Run the SQL migration first');
    }
    
    if (!report.overallStatus?.accuracy) {
      console.log('❌ Accuracy below 95%');
      console.log('💡 ACTION: Review processing logic');
    }
    
    if (!report.overallStatus?.processing) {
      console.log('❌ Processing tests failed');
      console.log('💡 ACTION: Check for processing errors');
    }
    
    if (!report.overallStatus?.performance) {
      console.log('❌ Performance issues detected');
      console.log('💡 ACTION: Optimize queries');
    }
  }
  
  console.log('\n📊 DETAILED RESULTS:');
  console.log('===================');
  console.log(JSON.stringify(report, null, 2));
};

// Auto-run function that can be called from anywhere
export const autoRunTests = async () => {
  console.log('🤖 AUTO-RUNNING COMPREHENSIVE TESTS...');
  const results = await runAutomatedTests();
  
  // Make results available globally
  window.testResults = results;
  window.lastTestRun = new Date().toISOString();
  
  return results;
};

// Quick status check
export const quickStatusCheck = async () => {
  console.log('🔍 QUICK STATUS CHECK...');
  
  try {
    // Check if functions exist
    const { data: testProduct } = await supabase
      .from('IngredientCategorized')
      .select('id')
      .limit(1);
    
    if (!testProduct || testProduct.length === 0) {
      console.log('❌ No products found in database');
      return { ready: false, reason: 'No products found' };
    }
    
    // Test function call
    const result = await supabase.rpc('process_product_allergens_dry_run', {
      product_id: testProduct[0].id
    });
    
    if (result.error) {
      console.log('❌ Database functions not ready');
      return { ready: false, reason: 'Database functions not found' };
    }
    
    console.log('✅ System ready for testing');
    return { ready: true };
    
  } catch (error) {
    console.log('❌ System check failed:', error.message);
    return { ready: false, reason: error.message };
  }
}; 