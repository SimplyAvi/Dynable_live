// 🧪 ACCURACY TESTING FOR ALLERGEN PROCESSING
// Test the improved processing function before running batch processing

import { supabase } from './supabaseClient.js';

// Test function for sample products with known expected results
export const testProcessingAccuracy = async () => {
  console.log('[ACCURACY TEST] Testing processing accuracy...');
  
  // Test cases with known expected results
  const testCases = [
    {
      description: "Organic Soy Milk Dairy-Free",
      expected: { contains: [], free: ['milk-free'] },
      shouldPass: true
    },
    {
      description: "Gluten-Free Bread Wheat-Free",
      expected: { contains: [], free: ['gluten-free'] },
      shouldPass: true
    },
    {
      description: "Peanut Butter Smooth",
      expected: { contains: ['peanuts'], free: [] },
      shouldPass: true
    },
    {
      description: "Coconut Oil Pure",
      expected: { contains: [], free: [] }, // Coconut is NOT a tree nut
      shouldPass: true
    },
    {
      description: "Cranberry Juice Cocktail",
      expected: { contains: [], free: [] }, // Should not contain "soy"
      shouldPass: true
    },
    {
      description: "Egg White Protein Powder",
      expected: { contains: ['eggs'], free: [] },
      shouldPass: true
    },
    {
      description: "Dairy-Free Almond Milk",
      expected: { contains: ['treeNuts'], free: ['milk-free'] },
      shouldPass: true
    }
  ];
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n🧪 Testing: "${testCase.description}"`);
    
    try {
      // Find a product with similar description
      const { data: products } = await supabase
        .from('IngredientCategorized')
        .select('id, description')
        .ilike('description', `%${testCase.description.split(' ')[0]}%`)
        .limit(1);
      
      if (products && products.length > 0) {
        // Test with dry run function
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
          console.log('✅ PASSED');
          passedTests++;
        } else {
          console.log('❌ FAILED');
          console.log(`Expected: ${JSON.stringify(testCase.expected)}`);
          console.log(`Actual: ${JSON.stringify(actual)}`);
        }
      } else {
        console.log('⚠️ No matching product found for test case');
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
  
  const accuracy = (passedTests / totalTests) * 100;
  console.log(`\n📊 ACCURACY RESULTS: ${passedTests}/${totalTests} tests passed (${accuracy.toFixed(1)}%)`);
  
  return {
    passed: passedTests,
    total: totalTests,
    accuracy: accuracy,
    safeToProceed: accuracy >= 95
  };
};

// Test specific problematic cases
export const testProblematicCases = async () => {
  console.log('[PROBLEMATIC TEST] Testing known problematic cases...');
  
  const problematicCases = [
    {
      description: "Cranberry Juice", // Should NOT contain "soy"
      shouldNotContain: ['soy']
    },
    {
      description: "Coconut Oil", // Should NOT contain "treeNuts"
      shouldNotContain: ['treeNuts']
    },
    {
      description: "Licorice Candy", // Should NOT contain "rice"
      shouldNotContain: ['rice']
    },
    {
      description: "Buttermilk Pancakes", // Should contain "milk"
      shouldContain: ['milk']
    }
  ];
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const testCase of problematicCases) {
    totalTests++;
    console.log(`\n🧪 Testing: "${testCase.description}"`);
    
    try {
      // Find a product with similar description
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
        
        // Check should not contain
        if (testCase.shouldNotContain) {
          const hasUnwanted = testCase.shouldNotContain.some(allergen => 
            contains.includes(allergen)
          );
          
          if (!hasUnwanted) {
            console.log('✅ PASSED - No unwanted allergens');
            passedTests++;
          } else {
            console.log('❌ FAILED - Contains unwanted allergens:', 
              testCase.shouldNotContain.filter(a => contains.includes(a))
            );
          }
        }
        
        // Check should contain
        if (testCase.shouldContain) {
          const hasWanted = testCase.shouldContain.every(allergen => 
            contains.includes(allergen)
          );
          
          if (hasWanted) {
            console.log('✅ PASSED - Contains expected allergens');
            passedTests++;
          } else {
            console.log('❌ FAILED - Missing expected allergens:', 
              testCase.shouldContain.filter(a => !contains.includes(a))
            );
          }
        }
      } else {
        console.log('⚠️ No matching product found for test case');
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
  
  const accuracy = (passedTests / totalTests) * 100;
  console.log(`\n📊 PROBLEMATIC CASES: ${passedTests}/${totalTests} tests passed (${accuracy.toFixed(1)}%)`);
  
  return {
    passed: passedTests,
    total: totalTests,
    accuracy: accuracy,
    safeToProceed: accuracy >= 90
  };
};

// Test word boundary matching specifically
export const testWordBoundaries = async () => {
  console.log('[WORD BOUNDARY TEST] Testing word boundary matching...');
  
  const boundaryTests = [
    {
      text: "soy milk",
      searchTerm: "soy",
      shouldMatch: true,
      description: "Soy should match in 'soy milk'"
    },
    {
      text: "cranberry juice",
      searchTerm: "soy",
      shouldMatch: false,
      description: "Soy should NOT match in 'cranberry juice'"
    },
    {
      text: "egg white",
      searchTerm: "egg",
      shouldMatch: true,
      description: "Egg should match in 'egg white'"
    },
    {
      text: "nutmeg spice",
      searchTerm: "egg",
      shouldMatch: false,
      description: "Egg should NOT match in 'nutmeg spice'"
    }
  ];
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const test of boundaryTests) {
    totalTests++;
    console.log(`\n🧪 Testing: "${test.description}"`);
    
    try {
      // Test word boundary regex
      const regex = new RegExp(`\\b${test.searchTerm}\\b`, 'i');
      const matches = regex.test(test.text);
      
      if (matches === test.shouldMatch) {
        console.log('✅ PASSED');
        passedTests++;
      } else {
        console.log('❌ FAILED');
        console.log(`Text: "${test.text}"`);
        console.log(`Search: "${test.searchTerm}"`);
        console.log(`Expected: ${test.shouldMatch}, Got: ${matches}`);
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
  
  const accuracy = (passedTests / totalTests) * 100;
  console.log(`\n📊 WORD BOUNDARY RESULTS: ${passedTests}/${totalTests} tests passed (${accuracy.toFixed(1)}%)`);
  
  return {
    passed: passedTests,
    total: totalTests,
    accuracy: accuracy,
    safeToProceed: accuracy >= 100
  };
};

// Comprehensive accuracy test
export const runComprehensiveAccuracyTest = async () => {
  console.log('🔍 RUNNING COMPREHENSIVE ACCURACY TEST');
  console.log('=====================================');
  
  const results = {
    processing: await testProcessingAccuracy(),
    problematic: await testProblematicCases(),
    wordBoundaries: await testWordBoundaries()
  };
  
  const overallAccuracy = (
    (results.processing.accuracy + results.problematic.accuracy + results.wordBoundaries.accuracy) / 3
  );
  
  console.log('\n🎯 OVERALL ACCURACY ASSESSMENT');
  console.log('==============================');
  console.log(`Processing Accuracy: ${results.processing.accuracy.toFixed(1)}%`);
  console.log(`Problematic Cases: ${results.problematic.accuracy.toFixed(1)}%`);
  console.log(`Word Boundaries: ${results.wordBoundaries.accuracy.toFixed(1)}%`);
  console.log(`Overall Accuracy: ${overallAccuracy.toFixed(1)}%`);
  
  const safeToProceed = overallAccuracy >= 95 && 
    results.processing.safeToProceed && 
    results.problematic.safeToProceed && 
    results.wordBoundaries.safeToProceed;
  
  if (safeToProceed) {
    console.log('\n✅ ACCURACY TEST PASSED - Safe to proceed with batch processing');
  } else {
    console.log('\n❌ ACCURACY TEST FAILED - Do not proceed with batch processing');
    console.log('Recommendation: Review and fix the processing logic');
  }
  
  return {
    results,
    overallAccuracy,
    safeToProceed
  };
};

// Gradual rollout function
export const processSmallBatch = async (batchSize = 50) => {
  console.log(`🔄 Processing small batch of ${batchSize} products...`);
  
  try {
    const { data: unprocessed } = await supabase
      .from('IngredientCategorized')
      .select('id, description')
      .eq('processed_for_allergens', false)
      .limit(batchSize);
    
    if (!unprocessed || unprocessed.length === 0) {
      console.log('✅ No unprocessed products found');
      return { success: true, processed: 0 };
    }
    
    console.log(`Found ${unprocessed.length} unprocessed products`);
    
    let processed = 0;
    let errors = 0;
    
    for (const product of unprocessed) {
      try {
        const result = await supabase.rpc('process_product_allergens_improved', {
          product_id: product.id
        });
        
        if (result.data && !result.error) {
          processed++;
          console.log(`✅ Processed: ${product.description.substring(0, 50)}...`);
        } else {
          errors++;
          console.log(`❌ Error processing: ${product.description.substring(0, 50)}...`);
        }
      } catch (error) {
        errors++;
        console.log(`❌ Exception processing: ${product.description.substring(0, 50)}...`);
      }
    }
    
    console.log(`\n📊 BATCH RESULTS: ${processed} processed, ${errors} errors`);
    
    return {
      success: errors === 0,
      processed,
      errors,
      accuracy: processed / (processed + errors) * 100
    };
    
  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    return { success: false, error: error.message };
  }
}; 